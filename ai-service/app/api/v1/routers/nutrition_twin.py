from fastapi import APIRouter, Depends

from app.core.security import require_internal_token
from app.ml.nutrition_twin import generate_nutrition_twin
from app.schemas.nutrition_twin import GenerateNutritionTwinRequest, NutritionTwinResponse

router = APIRouter(dependencies=[Depends(require_internal_token)])


@router.post("/generate", response_model=NutritionTwinResponse)
async def generate(request: GenerateNutritionTwinRequest):
    """
    Synchronous — this is a numpy trend calculation over rows already in
    Postgres, not an LLM call, so it's fast enough to wait on directly.
    """
    result = await generate_nutrition_twin(request.userId)
    return NutritionTwinResponse(**result)
