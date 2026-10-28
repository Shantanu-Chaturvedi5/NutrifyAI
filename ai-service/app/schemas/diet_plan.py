from pydantic import BaseModel

from app.schemas.personalization import HealthContextSchema


class GenerateDietPlanRequest(BaseModel):
    # Field names match backend-core's AiServiceClient.DietPlanTriggerRequest
    # exactly (Jackson's default camelCase serialization).
    planId: int
    calorieTarget: float
    proteinTarget: float
    healthContext: HealthContextSchema