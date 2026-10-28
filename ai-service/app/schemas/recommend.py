from pydantic import BaseModel


class RecomputeAlternativesRequest(BaseModel):
    category: str
