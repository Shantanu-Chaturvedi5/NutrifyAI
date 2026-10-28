from fastapi import APIRouter, BackgroundTasks, Depends

from app.core.security import require_internal_token
from app.schemas.diet_plan import GenerateDietPlanRequest
from app.services.diet_plan_generator import generate_diet_plan

router = APIRouter(dependencies=[Depends(require_internal_token)])


@router.post("/generate", status_code=202)
async def generate(request: GenerateDietPlanRequest, background_tasks: BackgroundTasks):
    """
    Triggered by backend-core's AiServiceClient right after a diet plan is
    created (calorie/protein targets already computed there). Returns
    immediately; the 7 day templates are generated in the background and
    POSTed back to backend-core's
    /api/v1/internal/diet-plans/{id}/generation-result when done.
    """
    background_tasks.add_task(generate_diet_plan, request.planId, request)
    return {"accepted": True}