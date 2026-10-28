from fastapi import APIRouter, Depends

from app.core.security import require_internal_token
from app.ml.content_based import recompute_alternatives_for_category
from app.schemas.recommend import RecomputeAlternativesRequest

router = APIRouter(dependencies=[Depends(require_internal_token)])


@router.post("/alternatives/recompute")
async def recompute_alternatives(request: RecomputeAlternativesRequest):
    """
    Recomputes product_alternatives for every product in a category.
    Triggered by backend-core's admin endpoint — not on a schedule yet
    (fine for catalog sizes a portfolio project deals with; a periodic
    job is the natural next step once the catalog is large/changes often).
    """
    updated = await recompute_alternatives_for_category(request.category)
    return {"category": request.category, "productsUpdated": updated}
