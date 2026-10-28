from pydantic import BaseModel


class NutritionInputSchema(BaseModel):
    calories: float | None = None
    proteinG: float | None = None
    fatG: float | None = None
    saturatedFatG: float | None = None
    carbsG: float | None = None
    sugarG: float | None = None
    fiberG: float | None = None
    sodiumMg: float | None = None
    cholesterolMg: float | None = None


class HealthContextSchema(BaseModel):
    conditions: list[str] = []
    goals: list[str] = []
    allergies: list[str] = []
    dietaryPreference: str | None = None


class ScoreProductRequest(BaseModel):
    nutrition: NutritionInputSchema
    ingredients: list[str] = []
    healthContext: HealthContextSchema


class ScoreProductResponse(BaseModel):
    suitabilityScore: int
    healthScore: int
    nutritionScore: int
    riskScore: int
    reasoning: list[str]
    recommendedDailyQuantity: str
    maxDailyQuantity: str
