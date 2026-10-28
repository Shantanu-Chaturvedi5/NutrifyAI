"""
Diet plan generation: given deterministic calorie/protein targets (computed
by backend-core, not here — see DietPlanService.computeTargets, a numeric
target a user might plan their eating around shouldn't come from something
that can hallucinate) plus the user's health context, generates 7 unique
day templates via one LLM call.

Always exactly 7 templates regardless of the plan's actual length — a
1-day plan uses the first one, a 30-day plan cycles through all 7 about
four times. backend-core does that cycling (it's the one that knows the
plan's real day count), so this module's only job is producing genuinely
varied meal content, once.
"""

import asyncio
import json
import logging

from app.core.llm_provider import get_chat_model
from app.schemas.diet_plan import GenerateDietPlanRequest
from app.services.backend_callback import send_diet_plan_result

logger = logging.getLogger(__name__)

DIET_PLAN_PROMPT = """You are creating a personalized meal plan.

Daily targets: approximately {calorie_target:.0f} kcal and {protein_target:.0f}g protein per day.

User context:
- Dietary preference: {dietary_preference}
- Medical conditions: {conditions}
- Active goals: {goals}
- Allergies to strictly avoid: {allergies}

Generate EXACTLY 7 unique day templates so the plan has real day-to-day
variety — these get reused/cycled by the app to cover however many days
the actual plan needs, so you don't need to know that number.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching
this exact shape:
{{
  "dayTemplates": [
    {{
      "meals": [
        {{"mealType": "BREAKFAST", "name": "...", "calories": number, "proteinG": number, "fatG": number, "saturatedFatG": number, "carbsG": number, "sugarG": number, "fiberG": number, "sodiumMg": number, "description": "..."}},
        {{"mealType": "LUNCH", "name": "...", "calories": number, "proteinG": number, "fatG": number, "saturatedFatG": number, "carbsG": number, "sugarG": number, "fiberG": number, "sodiumMg": number, "description": "..."}},
        {{"mealType": "DINNER", "name": "...", "calories": number, "proteinG": number, "fatG": number, "saturatedFatG": number, "carbsG": number, "sugarG": number, "fiberG": number, "sodiumMg": number, "description": "..."}},
        {{"mealType": "SNACK", "name": "...", "calories": number, "proteinG": number, "fatG": number, "saturatedFatG": number, "carbsG": number, "sugarG": number, "fiberG": number, "sodiumMg": number, "description": "..."}}
      ]
    }}
  ]
}}
(7 objects total in dayTemplates, each with exactly those 4 meal entries.)

Rules:
- Never include an ingredient that conflicts with the allergies listed above — this is a hard constraint, not a suggestion.
- Respect the dietary preference strictly (e.g. a vegetarian preference means no meat, fish, or eggs).
- Each day's four meals should sum to approximately the daily calorie and protein targets (within about 10%).
- Give a genuine, realistic estimate for every nutrient field (fatG, saturatedFatG, carbsG, sugarG, fiberG, sodiumMg) for each meal — not just calories/protein. If you're unsure of an exact figure, give your best realistic estimate rather than omitting it or using 0.
- Make the 7 templates genuinely different from each other — don't just reword the same meals with swapped ingredients.
- "description" is one or two sentences — what it is and roughly how it's prepared, not a full recipe.
"""


async def generate_diet_plan(plan_id: int, request: GenerateDietPlanRequest) -> None:
    try:
        hc = request.healthContext
        prompt = DIET_PLAN_PROMPT.format(
            calorie_target=request.calorieTarget,
            protein_target=request.proteinTarget,
            dietary_preference=hc.dietaryPreference or "no specific preference",
            conditions=", ".join(hc.conditions) or "none reported",
            goals=", ".join(hc.goals) or "none set",
            allergies=", ".join(hc.allergies) or "none reported",
        )

        llm = get_chat_model()
        # llm.invoke is a blocking network call — offload it so this
        # service's event loop stays free for other requests while
        # generation is in progress (same reasoning as report_analyzer.py
        # and product_scanner.py).
        response = await asyncio.to_thread(llm.invoke, prompt)
        content = response.content if hasattr(response, "content") else str(response)

        parsed = _parse_llm_json(content)
        day_templates = parsed.get("dayTemplates") if parsed else None
        if not day_templates:
            logger.warning("Diet plan %s: could not parse LLM response as JSON: %r", plan_id, content[:500])
            await send_diet_plan_result(
                plan_id, False,
                "The AI model's response couldn't be parsed as structured data. A different LLM_PROVIDER may do better here.",
                None,
            )
            return

        await send_diet_plan_result(plan_id, True, None, day_templates)

    except Exception as e:
        logger.exception("Diet plan %s: generation failed", plan_id)
        await send_diet_plan_result(plan_id, False, f"Generation failed: {e}", None)


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