from fastapi import APIRouter, Depends

from app.core.security import require_internal_token
from app.ml.personalization import HealthContext, NutritionInput, score_product
from app.schemas.personalization import ScoreProductRequest, ScoreProductResponse

router = APIRouter(dependencies=[Depends(require_internal_token)])


@router.post("/score", response_model=ScoreProductResponse)
async def score(request: ScoreProductRequest):
    """
    Pure computation, no DB access — backend-core already has both the
    product's nutrition facts and the user's health profile, so it
    assembles the full context and passes it in rather than this service
    re-fetching data it doesn't own.
    """
    nutrition = NutritionInput(
        calories=request.nutrition.calories,
        protein_g=request.nutrition.proteinG,
        fat_g=request.nutrition.fatG,
        saturated_fat_g=request.nutrition.saturatedFatG,
        carbs_g=request.nutrition.carbsG,
        sugar_g=request.nutrition.sugarG,
        fiber_g=request.nutrition.fiberG,
        sodium_mg=request.nutrition.sodiumMg,
        cholesterol_mg=request.nutrition.cholesterolMg,
    )
    context = HealthContext(
        conditions=request.healthContext.conditions,
        goals=request.healthContext.goals,
        allergies=request.healthContext.allergies,
        dietary_preference=request.healthContext.dietaryPreference,
    )

    result = score_product(nutrition, request.ingredients, context)

    return ScoreProductResponse(
        suitabilityScore=result.suitability_score,
        healthScore=result.health_score,
        nutritionScore=result.nutrition_score,
        riskScore=result.risk_score,
        reasoning=result.reasoning,
        recommendedDailyQuantity=result.recommended_daily_quantity,
        maxDailyQuantity=result.max_daily_quantity,
    )
