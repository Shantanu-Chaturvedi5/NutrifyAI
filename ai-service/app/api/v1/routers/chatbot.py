from fastapi import APIRouter, Depends

from app.core.security import require_internal_token
from app.schemas.chatbot import ChatMessageRequest, ChatMessageResponse, RetrievedChunk
from app.services.chatbot import get_reply

router = APIRouter(dependencies=[Depends(require_internal_token)])


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(request: ChatMessageRequest):
    """
    Synchronous, unlike report analysis — the frontend is waiting on a
    reply, so backend-core calls this and blocks for the response rather
    than firing a background task.
    """
    reply, chunks = await get_reply(request.message, request.healthContext)
    return ChatMessageResponse(
        reply=reply,
        retrievedContext=[RetrievedChunk(source=c["source"], score=c["score"]) for c in chunks],
    )
