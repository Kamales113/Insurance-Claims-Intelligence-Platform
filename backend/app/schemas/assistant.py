"""Schemas for the Insurance Policy Assistant feature."""

from typing import Optional

from pydantic import Field, field_validator

from app.core.config import settings
from app.schemas.auth import BaseSchema
from app.schemas.knowledge import RetrievalResult


class AssistantChatRequest(BaseSchema):
    message: str = Field(min_length=1, max_length=2_000)
    policy_type: Optional[str] = Field(default=None, max_length=100)
    top_k: int = Field(default=5, ge=1, le=50)

    @field_validator("message")
    @classmethod
    def require_non_whitespace_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message must not be blank.")
        return value


class AssistantChatResponse(BaseSchema):
    answer: str
    sources: list[RetrievalResult]
    model: str = Field(default_factory=lambda: settings.GEMINI_MODEL)
