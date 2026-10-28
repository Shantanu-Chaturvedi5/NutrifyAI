from pydantic import BaseModel

from app.schemas.personalization import HealthContextSchema


class AnalyzeReportRequest(BaseModel):
    # Field names match backend-core's AiServiceClient.ReportAnalysisTriggerRequest
    # exactly (Jackson's default camelCase serialization) — no alias juggling
    # needed across the service boundary.
    reportId: int
    s3Key: str
    reportType: str
    # Same shape as personalization.py's product-scoring request — reused
    # rather than duplicated, so "what counts as health context" has one
    # definition across the whole service.
    healthContext: HealthContextSchema