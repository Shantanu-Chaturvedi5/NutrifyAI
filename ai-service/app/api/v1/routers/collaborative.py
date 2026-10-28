from fastapi import APIRouter, Depends

from app.core.security import require_internal_token
from app.ml.collaborative import get_people_like_you_recommendations
from app.schemas.collaborative import PeopleLikeYouRequest, PeopleLikeYouResponse, RecommendedProduct

router = APIRouter(dependencies=[Depends(require_internal_token)])


@router.post("/people-like-you", response_model=PeopleLikeYouResponse)
async def people_like_you(request: PeopleLikeYouRequest):
    results = await get_people_like_you_recommendations(request.userId)
    return PeopleLikeYouResponse(
        recommendations=[
            RecommendedProduct(
                productId=r["productId"], name=r["name"], brand=r["brand"],
                score=r["score"], reasoning=r["reasoning"],
            )
            for r in results
        ]
    )
