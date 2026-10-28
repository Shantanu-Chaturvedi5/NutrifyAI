"""
Restaurant menu analysis: OCR the menu photo, then have the LLM identify
distinct food/drink items and estimate their nutrition — then, using the
same health context (conditions/goals/allergies/dietary preference) diet
plan generation receives, flag which items suit this user and why.

Unlike the product scanner, there's no printed nutrition label to read
here — the LLM is estimating calories/protein from its general knowledge
of how a dish like that is typically prepared, not extracting measured
facts. That's a meaningfully different (and less certain) kind of claim,
so the prompt asks for realistic estimates rather than invented
precision, and the frontend should label these as estimates, not facts.
"""

import asyncio
import json
import logging

from app.core.llm_provider import get_chat_model
from app.ocr.extractor import extract_text
from app.schemas.restaurant_menu import AnalyzeRestaurantMenuRequest
from app.services.backend_callback import send_restaurant_menu_result
from app.services.s3_client import download_bytes

logger = logging.getLogger(__name__)

MENU_ANALYSIS_PROMPT = """You are analyzing OCR text taken from a photo of a restaurant menu.

User context (use this to decide which items to recommend):
- Dietary preference: {dietary_preference}
- Medical conditions: {conditions}
- Active goals: {goals}
- Allergies to strictly avoid: {allergies}

Respond with ONLY valid JSON (no markdown fences, no commentary) matching
this exact shape:
{{
  "restaurantNameGuess": "string or null - if the menu header names the restaurant, else null",
  "items": [
    {{
      "itemName": "...",
      "estimatedCalories": number or null,
      "estimatedProteinG": number or null,
      "isRecommended": true or false,
      "recommendationReason": "one short sentence"
    }}
  ]
}}

Rules:
- List every distinct food/drink item you can read, skipping prices and section headers.
- estimatedCalories/estimatedProteinG are realistic estimates based on how a dish like that is typically prepared — the menu itself won't state these, so use your general knowledge, and use null only if you genuinely can't guess (e.g. the item name is illegible).
- Never recommend an item that conflicts with the allergies listed above — this is a hard constraint, not a suggestion.
- Never recommend an item that conflicts with the dietary preference (e.g. don't recommend a meat dish to a vegetarian).
- isRecommended should reflect whether this item is a genuinely good choice given the user's conditions and goals, not just "is it healthy in general."
- recommendationReason should explain the recommendation either way in one short sentence — for a recommended item, why it fits; for a non-recommended item, what makes it a poorer fit.

OCR TEXT:
---
{ocr_text}
---
"""

MAX_OCR_CHARS = 6000  # a menu can span several pages/columns


async def analyze_restaurant_menu(menu_id: int, request: AnalyzeRestaurantMenuRequest) -> None:
    try:
        file_bytes = await asyncio.to_thread(download_bytes, request.s3Key)
        ocr_text = await asyncio.to_thread(extract_text, file_bytes)

        if not ocr_text.strip():
            await send_restaurant_menu_result(
                menu_id, False,
                "Could not read any text from the photo — try a clearer, well-lit shot of the menu.",
                None, None,
            )
            return

        hc = request.healthContext
        prompt = MENU_ANALYSIS_PROMPT.format(
            dietary_preference=hc.dietaryPreference or "no specific preference",
            conditions=", ".join(hc.conditions) or "none reported",
            goals=", ".join(hc.goals) or "none set",
            allergies=", ".join(hc.allergies) or "none reported",
            ocr_text=ocr_text[:MAX_OCR_CHARS],
        )

        llm = get_chat_model()
        response = await asyncio.to_thread(llm.invoke, prompt)
        content = response.content if hasattr(response, "content") else str(response)

        parsed = _parse_llm_json(content)
        items = parsed.get("items") if parsed else None
        if not items:
            logger.warning("Menu %s: could not parse LLM response as JSON: %r", menu_id, content[:500])
            await send_restaurant_menu_result(
                menu_id, False,
                "The AI model's response couldn't be parsed as structured data. A different LLM_PROVIDER may do better here.",
                None, None,
            )
            return

        await send_restaurant_menu_result(menu_id, True, None, parsed.get("restaurantNameGuess"), items)

    except Exception as e:
        logger.exception("Menu %s: analysis failed", menu_id)
        await send_restaurant_menu_result(menu_id, False, f"Analysis failed: {e}", None, None)


def _parse_llm_json(content: str) -> dict | None:
    text = content.strip()

    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None

    return None