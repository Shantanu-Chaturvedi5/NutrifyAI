from pydantic import BaseModel

from app.schemas.personalization import HealthContextSchema


class AnalyzeRestaurantMenuRequest(BaseModel):
    menuId: int
    s3Key: str
    healthContext: HealthContextSchema