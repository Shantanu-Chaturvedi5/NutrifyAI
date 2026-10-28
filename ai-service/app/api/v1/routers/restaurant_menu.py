from fastapi import APIRouter, BackgroundTasks, Depends

from app.core.security import require_internal_token
from app.schemas.restaurant_menu import AnalyzeRestaurantMenuRequest
from app.services.restaurant_menu_analyzer import analyze_restaurant_menu

router = APIRouter(dependencies=[Depends(require_internal_token)])


@router.post("/analyze", status_code=202)
async def analyze(request: AnalyzeRestaurantMenuRequest, background_tasks: BackgroundTasks):
    """
    Triggered by backend-core's AiServiceClient right after a menu photo
    is uploaded. Returns immediately; OCR + LLM analysis happens in the
    background, and the result is POSTed back to backend-core's
    /api/v1/internal/restaurant-menus/{id}/analysis-result when done.
    """
    background_tasks.add_task(analyze_restaurant_menu, request.menuId, request)
    return {"accepted": True}