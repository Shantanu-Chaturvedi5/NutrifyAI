from pydantic import BaseModel


class AnalyzeProductScanRequest(BaseModel):
    # Field names match backend-core's AiServiceClient.ProductScanTriggerRequest
    # exactly (Jackson's default camelCase serialization).
    scanId: int
    s3Key: str