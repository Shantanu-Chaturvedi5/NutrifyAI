"""
Product label scanning: OCR -> LLM structured extraction -> callback to
backend-core, which creates the actual Product/ProductNutrition/
ProductIngredients rows. This service only extracts; it never touches the
product tables directly — same OCR-then-callback split report_analyzer.py
uses for medical reports.

Once backend-core creates the product from this data, the EXISTING
personalized-score endpoint (ProductPersonalizationService, calling
app/ml/personalization.py) automatically handles "is this suitable for me /
how much should I eat" — nothing extra is needed here for that part; this
module's only job is turning a label photo into structured nutrition data.
"""

import asyncio
import json
import logging

from app.core.llm_provider import get_chat_model
from app.ocr.extractor import extract_text
from app.services.backend_callback import send_product_scan_result
from app.services.s3_client import download_bytes

logger = logging.getLogger(__name__)

ANALYSIS_PROMPT = """You are analyzing OCR text taken from a photo of a packaged food product's nutrition label and/or ingredients list.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching this exact shape:
{{
  "productNameGuess": "string or null - product name if visible on the label, else null",
  "brandGuess": "string or null - brand name if visible, else null",
  "servingSize": "string or null, e.g. '30 g' or '1 pack (25g)'",
  "calories": number or null,
  "proteinG": number or null,
  "fatG": number or null,
  "saturatedFatG": number or null,
  "carbsG": number or null,
  "sugarG": number or null,
  "fiberG": number or null,
  "sodiumMg": number or null,
  "cholesterolMg": number or null,
  "ingredients": ["ingredient 1", "ingredient 2"]
}}

All nutrition values should reflect a single serving as printed on the
label. If the label only shows a "per 100g" column, use that and set
servingSize to "100 g". If a value isn't visible or legible, use null —
never estimate or invent a number. List ingredients in the order printed
on the label, or an empty list if no ingredients section is visible.

OCR TEXT:
---
{ocr_text}
---
"""

# A label photo's OCR text is short (one package, not a multi-page
# document) — no need for the larger cap report_analyzer.py uses.
MAX_OCR_CHARS = 4000


async def analyze_product_scan(scan_id: int, s3_key: str) -> None:
    try:
        # download_bytes/extract_text/llm.invoke are synchronous, blocking
        # calls — extract_text (PaddleOCR) is CPU-heavy and llm.invoke is a
        # blocking network call. Offloading to a thread keeps this
        # service's event loop free to handle other requests while a scan
        # is being analyzed (see report_analyzer.py for the same fix and
        # why it matters — without it, the whole service freezes for the
        # duration of every analysis).
        file_bytes = await asyncio.to_thread(download_bytes, s3_key)
        ocr_text = await asyncio.to_thread(extract_text, file_bytes)

        if not ocr_text.strip():
            await send_product_scan_result(
                scan_id, False,
                "Could not read any text from the photo — try a clearer, well-lit shot of the label.",
                None,
            )
            return

        llm = get_chat_model()
        prompt = ANALYSIS_PROMPT.format(ocr_text=ocr_text[:MAX_OCR_CHARS])
        response = await asyncio.to_thread(llm.invoke, prompt)
        content = response.content if hasattr(response, "content") else str(response)

        parsed = _parse_llm_json(content)
        if parsed is None:
            logger.warning("Scan %s: could not parse LLM response as JSON: %r", scan_id, content[:500])
            await send_product_scan_result(
                scan_id, False,
                "The AI model's response couldn't be parsed as structured data. A different LLM_PROVIDER may do better on this photo.",
                None,
            )
            return

        # Require at least one real signal — a label photo that yields
        # neither nutrition facts nor an ingredients list almost certainly
        # wasn't actually a food label (or was unreadable), and creating an
        # empty product from it wouldn't be useful to anyone.
        if parsed.get("calories") is None and not parsed.get("ingredients"):
            await send_product_scan_result(
                scan_id, False,
                "Couldn't find nutrition facts or an ingredients list in this photo — "
                "make sure the back-of-pack label is fully visible and in focus.",
                None,
            )
            return

        await send_product_scan_result(scan_id, True, None, parsed)

    except Exception as e:
        logger.exception("Scan %s: analysis failed", scan_id)
        await send_product_scan_result(scan_id, False, f"Analysis failed: {e}", None)


def _parse_llm_json(content: str) -> dict | None:
    text = content.strip()

    # Small/local models often wrap JSON in markdown fences despite
    # instructions not to — strip them before parsing.
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Last resort: grab the outermost {...} span and try again.
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None

    return None