from fastapi import APIRouter, BackgroundTasks, Depends

from app.core.security import require_internal_token
from app.schemas.report_analyzer import AnalyzeReportRequest
from app.services.report_analyzer import analyze_report

router = APIRouter(dependencies=[Depends(require_internal_token)])


@router.post("/analyze", status_code=202)
async def analyze(request: AnalyzeReportRequest, background_tasks: BackgroundTasks):
    """
    Triggered by backend-core's AiServiceClient right after a report
    upload. Returns immediately; the actual OCR + LLM work happens in the
    background, and the result is POSTed back to backend-core's
    /api/v1/internal/reports/{id}/analysis-result when done.
    """
    background_tasks.add_task(
        analyze_report, request.reportId, request.s3Key, request.reportType, request.healthContext
    )
    return {"accepted": True}