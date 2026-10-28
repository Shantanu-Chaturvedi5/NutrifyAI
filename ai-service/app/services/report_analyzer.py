"""
Health report analysis: OCR -> LLM structuring -> callback to backend-core.

Runs as a FastAPI background task (see the router), so the triggering
request returns immediately — this can take anywhere from a few seconds
to a minute depending on file size and which LLM provider is configured.

The LLM is given both the OCR'd report text AND the user's health context
(conditions, active goals, allergies, dietary preference — same shape as
product-scoring's HealthContext) in one call, so the values it extracts
and the suggestions it writes are grounded in the same reasoning pass —
not a generic lab-value explainer bolted onto a separate rules engine.
"""

import asyncio
import json
import logging

from app.core.llm_provider import get_chat_model
from app.ocr.extractor import extract_text
from app.schemas.personalization import HealthContextSchema
from app.services.backend_callback import send_report_analysis_result
from app.services.s3_client import download_bytes

logger = logging.getLogger(__name__)

ANALYSIS_PROMPT = """You are a clinical lab report parser and nutrition assistant. Given raw OCR text from a {report_type} report, extract every measurable parameter you can find, then suggest a few concrete next steps personalized to this specific patient.

{health_context_block}

Respond with ONLY valid JSON (no markdown fences, no commentary) matching this exact shape:
{{
  "summary": "one or two sentence plain-language summary of the most notable findings",
  "values": [
    {{
      "parameterName": "string, e.g. Vitamin D",
      "value": number or null,
      "unit": "string or null",
      "referenceRangeLow": number or null,
      "referenceRangeHigh": number or null,
      "status": one of "NORMAL", "LOW", "HIGH", "DEFICIENT", "CRITICAL"
    }}
  ],
  "suggestions": [
    "2-5 short, concrete, actionable suggestions — diet, lifestyle, or 'discuss X with your doctor' — that connect this report's findings to the patient's actual conditions/goals/allergies/diet above. Only suggest things the findings and profile actually support; don't pad with generic advice unrelated to what was found."
  ]
}}

Use "DEFICIENT" for vitamins/minerals below range, "LOW" or "HIGH" for other
out-of-range parameters, "CRITICAL" only for dangerously abnormal values,
"NORMAL" otherwise. If you can't confidently extract a value, omit it
rather than guessing. If nothing in the report is out of range and the
patient's profile raises no specific concern, suggestions can be a single
short reassurance rather than invented advice.

This is not a diagnosis — suggestions should read like what a careful
nutrition label reader would flag for themselves, not medical instructions.
For anything genuinely abnormal or CRITICAL, the suggestion should point
the patient toward talking to their doctor rather than self-treating.

OCR TEXT:
---
{ocr_text}
---
"""

NO_HEALTH_CONTEXT_NOTE = "This patient hasn't set up a health profile yet — base suggestions only on what the report itself shows, with no assumptions about conditions, goals, allergies, or diet."

# Small/local models can produce noisy OCR-derived prompts — cap input size
# so we don't blow past a small model's context window.
MAX_OCR_CHARS = 8000


def _health_context_block(health_context: HealthContextSchema) -> str:
    if not any([health_context.conditions, health_context.goals,
                health_context.allergies, health_context.dietaryPreference]):
        return NO_HEALTH_CONTEXT_NOTE

    lines = ["Patient health profile:"]
    lines.append(f"- Medical conditions: {', '.join(health_context.conditions) or 'None specified'}")
    lines.append(f"- Active health goals: {', '.join(health_context.goals) or 'None specified'}")
    lines.append(f"- Allergies: {', '.join(health_context.allergies) or 'None specified'}")
    lines.append(f"- Dietary preference: {health_context.dietaryPreference or 'None specified'}")
    return "\n".join(lines)


async def analyze_report(
    report_id: int, s3_key: str, report_type: str, health_context: HealthContextSchema
) -> None:
    try:
        # download_bytes/extract_text/llm.invoke are all synchronous,
        # blocking calls — extract_text (PaddleOCR) is genuinely CPU-heavy
        # and llm.invoke is a blocking network call. Running any of these
        # directly in this async function would freeze the *entire*
        # ai-service event loop for the whole duration (FastAPI runs
        # `async def` background tasks on the main loop, not a thread) —
        # meaning no other request, including health checks, gets served
        # until analysis finishes. asyncio.to_thread keeps the loop free.
        file_bytes = await asyncio.to_thread(download_bytes, s3_key)
        ocr_text = await asyncio.to_thread(extract_text, file_bytes)

        if not ocr_text.strip():
            await send_report_analysis_result(
                report_id, False,
                "Could not read any text from the uploaded file — try a clearer scan or a text-based PDF.",
                {}, []
            )
            return

        llm = get_chat_model()
        prompt = ANALYSIS_PROMPT.format(
            report_type=report_type,
            health_context_block=_health_context_block(health_context),
            ocr_text=ocr_text[:MAX_OCR_CHARS],
        )
        response = await asyncio.to_thread(llm.invoke, prompt)
        content = response.content if hasattr(response, "content") else str(response)

        parsed = _parse_llm_json(content)
        if parsed is None:
            logger.warning("Report %s: could not parse LLM response as JSON: %r", report_id, content[:500])
            await send_report_analysis_result(
                report_id, False,
                "The AI model's response couldn't be parsed as structured data. A different LLM_PROVIDER may do better on this report.",
                {"rawText": ocr_text, "llmRawResponse": content}, []
            )
            return

        suggestions = [s for s in parsed.get("suggestions", []) if isinstance(s, str) and s.strip()]
        raw_extraction = {
            "rawText": ocr_text,
            "llmSummary": parsed.get("summary", ""),
            "suggestions": suggestions,
        }
        values = parsed.get("values", [])
        await send_report_analysis_result(report_id, True, None, raw_extraction, values)

    except Exception as e:
        logger.exception("Report %s: analysis failed", report_id)
        await send_report_analysis_result(report_id, False, f"Analysis failed: {e}", {}, [])


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