from pydantic import BaseModel


class GenerateNutritionTwinRequest(BaseModel):
    userId: int


class NutritionTwinResponse(BaseModel):
    snapshotDate: str
    healthTrendSummary: str
    deficiencyTrendSummary: str
    riskPredictionSummary: str
