from pydantic import BaseModel


class PeopleLikeYouRequest(BaseModel):
    userId: int


class RecommendedProduct(BaseModel):
    productId: int
    name: str
    brand: str | None
    score: float
    reasoning: str


class PeopleLikeYouResponse(BaseModel):
    recommendations: list[RecommendedProduct]
