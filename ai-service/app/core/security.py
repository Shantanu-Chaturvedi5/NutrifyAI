from fastapi import Header, HTTPException, status

from app.core.config import settings


async def require_internal_token(x_internal_token: str = Header(...)) -> None:
    """
    Every route in this service is internal-only — called by backend-core,
    never by the frontend. Shared-secret check, not user JWT (there's no
    user session at this layer).
    """
    if x_internal_token != settings.AI_SERVICE_INTERNAL_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal service token.")
