from fastapi import APIRouter, BackgroundTasks, Depends

from app.core.security import require_internal_token
from app.schemas.product_scanner import AnalyzeProductScanRequest
from app.services.product_scanner import analyze_product_scan

router = APIRouter(dependencies=[Depends(require_internal_token)])


@router.post("/analyze", status_code=202)
async def analyze(request: AnalyzeProductScanRequest, background_tasks: BackgroundTasks):
    """
    Triggered by backend-core's AiServiceClient right after a product scan
    upload. Returns immediately; OCR + LLM extraction happens in the
    background, and the result is POSTed back to backend-core's
    /api/v1/internal/product-scans/{id}/analysis-result when done.
    """
    background_tasks.add_task(analyze_product_scan, request.scanId, request.s3Key)
    return {"accepted": True}