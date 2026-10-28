"""
Personalized Product Analysis: the suitability/health/nutrition/risk
scores described in the original spec, computed per (user, product) —
unlike the generic heuristic in ml/content_based.py, which only ranks
alternatives and knows nothing about who's asking.

This is an explicit, inspectable rules engine, not a black-box model —
deliberately so. A health-adjacent score should be traceable to specific
reasons ("high sodium + hypertension"), not an opaque number. It is not a
validated clinical tool; it's a transparent heuristic that reasons over
the same kind of guidance a nutrition label would prompt a careful reader
to apply themselves.

All the numbers a product needs are passed in by the caller (backend-core
already has both the product's nutrition facts and the user's health
profile) — this module does no DB access of its own.
"""

from dataclasses import dataclass, field

# Keyword heuristic only — there's no ingredient categorization in the
# schema yet, so dietary-preference conflicts are detected by scanning
# ingredient names for common non-veg/non-vegan markers. False negatives
# are likely (e.g. less common meat names); flagged in the response
# reasoning as a heuristic, not a guarantee.
NON_VEGETARIAN_MARKERS = {
    "chicken", "beef", "pork", "mutton", "lamb", "fish", "shrimp", "prawn",
    "bacon", "ham", "gelatin", "anchovy", "lard",
}
NON_VEGAN_MARKERS = NON_VEGETARIAN_MARKERS | {"milk", "cheese", "butter", "cream", "egg", "honey", "whey", "casein"}


@dataclass
class NutritionInput:
    calories: float | None = None
    protein_g: float | None = None
    fat_g: float | None = None
    saturated_fat_g: float | None = None
    carbs_g: float | None = None
    sugar_g: float | None = None
    fiber_g: float | None = None
    sodium_mg: float | None = None
    cholesterol_mg: float | None = None


@dataclass
class HealthContext:
    conditions: list[str] = field(default_factory=list)  # condition codes, e.g. "DIABETES"
    goals: list[str] = field(default_factory=list)  # goal codes, e.g. "WEIGHT_LOSS"
    allergies: list[str] = field(default_factory=list)  # allergy names, e.g. "Peanuts"
    dietary_preference: str | None = None  # e.g. "VEGETARIAN"


@dataclass
class ScoreResult:
    suitability_score: int
    health_score: int
    nutrition_score: int
    risk_score: int
    reasoning: list[str]
    recommended_daily_quantity: str
    max_daily_quantity: str


def score_product(
    nutrition: NutritionInput,
    ingredients: list[str],
    context: HealthContext,
) -> ScoreResult:
    reasons: list[str] = []
    ingredient_names = {i.lower() for i in ingredients}

    # --- Hard stop: allergen conflict -----------------------------------
    allergy_hit = next(
        (a for a in context.allergies if a.lower() in ingredient_names or any(a.lower() in i for i in ingredient_names)),
        None,
    )
    if allergy_hit:
        return ScoreResult(
            suitability_score=0, health_score=0, nutrition_score=0, risk_score=100,
            reasoning=[f"Contains {allergy_hit}, which is on your allergy list — do not consume."],
            recommended_daily_quantity="0 servings",
            max_daily_quantity="0 servings",
        )

    # --- Soft flag: dietary preference conflict (keyword heuristic) -----
    diet_conflict = False
    if context.dietary_preference == "VEGAN":
        hit = ingredient_names & NON_VEGAN_MARKERS
        if hit:
            diet_conflict = True
            reasons.append(f"Ingredient list suggests this may not be vegan ({', '.join(sorted(hit))}).")
    elif context.dietary_preference == "VEGETARIAN":
        hit = ingredient_names & NON_VEGETARIAN_MARKERS
        if hit:
            diet_conflict = True
            reasons.append(f"Ingredient list suggests this may not be vegetarian ({', '.join(sorted(hit))}).")

    # --- Base nutrition quality (condition-agnostic) --------------------
    calories = nutrition.calories or 0
    sugar = nutrition.sugar_g or 0
    fiber = nutrition.fiber_g or 0
    protein = nutrition.protein_g or 0
    sodium = nutrition.sodium_mg or 0
    sat_fat = nutrition.saturated_fat_g or 0

    health_score = 50.0
    health_score += min(20.0, fiber * 2)
    health_score += min(15.0, protein)
    health_score -= min(25.0, (sugar / calories) * 100) if calories else 0
    health_score -= min(15.0, (sodium / 2300.0) * 15)
    health_score -= min(10.0, sat_fat)
    health_score = max(0.0, min(100.0, health_score))

    protein_density = (protein / calories * 100) if calories else 0
    nutrition_score = 50.0
    nutrition_score += min(25.0, protein_density * 2)
    nutrition_score += min(15.0, fiber * 1.5)
    nutrition_score -= min(20.0, (sugar / calories) * 100) if calories else 0
    nutrition_score = max(0.0, min(100.0, nutrition_score))

    # --- Condition-specific risk ----------------------------------------
    risk_score = 0.0

    def flag(points: float, reason: str) -> None:
        nonlocal risk_score
        risk_score = min(100.0, risk_score + points)
        reasons.append(reason)

    conditions = set(context.conditions)

    if "DIABETES" in conditions or "BLOOD_SUGAR_CONTROL" in set(context.goals):
        if calories and (sugar / calories) * 100 > 15:
            flag(25, "High sugar relative to calories — a concern for blood sugar control.")
        elif fiber >= 3:
            reasons.append("Reasonable fiber content, which helps moderate blood sugar impact.")

    if "HYPERTENSION" in conditions or "HEART_DISEASE" in conditions:
        if sodium > 400:
            flag(20, "High sodium per serving — a concern for blood pressure/heart health.")

    if "HEART_DISEASE" in conditions:
        if sat_fat > 5:
            flag(15, "Meaningful saturated fat content — a concern for heart health.")

    if "KIDNEY_DISEASE" in conditions:
        if protein > 20:
            flag(20, "High protein per serving — kidney disease often calls for moderated protein; check with your doctor.")
        if sodium > 400:
            flag(10, "High sodium — often also restricted with kidney disease.")

    if "OBESITY" in conditions or "WEIGHT_LOSS" in set(context.goals) or "FAT_LOSS" in set(context.goals):
        if calories and protein_density < 5 and fiber < 2:
            flag(10, "Low protein/fiber relative to calories — less filling per calorie, worth portioning carefully for a weight-loss goal.")

    if "MUSCLE_GAIN" in set(context.goals) or "WEIGHT_GAIN" in set(context.goals):
        if protein >= 15:
            reasons.append("Good protein content, which supports a muscle/weight gain goal.")

    if diet_conflict:
        risk_score = min(100.0, risk_score + 15)

    # --- Suitability: combine health quality and personal risk ----------
    suitability_score = max(0.0, min(100.0, health_score - risk_score * 0.6))

    if not reasons:
        reasons.append("No specific concerns identified for your profile based on this product's nutrition facts.")

    # --- Quantity guidance (rough, calorie-anchored) --------------------
    if calories <= 0:
        recommended, maximum = "1 serving/day", "2 servings/day"
    else:
        # ~150-250 kcal treated as a typical single snack/meal-component serving budget.
        if risk_score >= 40:
            recommended, maximum = "Occasional only", "1 serving/week"
        elif calories > 400:
            recommended, maximum = "1/2 serving/day", "1 serving/day"
        elif calories > 200:
            recommended, maximum = "1 serving/day", "1 serving/day"
        else:
            recommended, maximum = "1 serving/day", "2 servings/day"

    return ScoreResult(
        suitability_score=int(round(suitability_score)),
        health_score=int(round(health_score)),
        nutrition_score=int(round(nutrition_score)),
        risk_score=int(round(risk_score)),
        reasoning=reasons,
        recommended_daily_quantity=recommended,
        max_daily_quantity=maximum,
    )
