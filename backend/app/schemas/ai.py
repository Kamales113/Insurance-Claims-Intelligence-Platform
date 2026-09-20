from typing import Optional
from pydantic import Field

from app.schemas.auth import BaseSchema
from app.schemas.knowledge import RetrievalResult


class AITestRequest(BaseSchema):
    prompt: str = Field(min_length=1, max_length=2_000)


class AITestResponse(BaseSchema):
    response: str


class AIRetrievalRequest(BaseSchema):
    query: str = Field(min_length=1, max_length=1_000)
    top_k: int = Field(default=5, ge=1, le=50)
    policy_type: Optional[str] = Field(default=None, max_length=100)


class AIRetrievalResponse(BaseSchema):
    results: list[RetrievalResult]

