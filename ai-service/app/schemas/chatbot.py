from pydantic import BaseModel


class ChatMessageRequest(BaseModel):
    userId: int
    message: str
    # Optional summary from backend-core: conditions, goals, allergies —
    # used to personalize the reply. Never invented if omitted.
    healthContext: dict | None = None


class RetrievedChunk(BaseModel):
    source: str
    score: float


class ChatMessageResponse(BaseModel):
    reply: str
    retrievedContext: list[RetrievedChunk]
