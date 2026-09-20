from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.auth import BaseSchema

KnowledgeCategory = Literal[
    "coverage", "exclusions", "deductible", "claims", "documentation", "general"
]



class KnowledgeDocument(BaseSchema):
    id: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    policy_type: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    category: KnowledgeCategory
    source: str = Field(min_length=1, max_length=100)

    @field_validator("policy_type", "title", "content", "source")
    @classmethod
    def require_non_whitespace(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field must not be blank")
        return value


class KnowledgeBase(BaseSchema):
    knowledge_base_version: str = Field(min_length=1, max_length=20)
    last_updated: date
    documents: list[KnowledgeDocument] = Field(min_length=1)


class RetrievalResult(BaseModel):

    document_id: str
    policy_type: str
    title: str
    category: KnowledgeCategory
    content: str
    source: str
    similarity: float

    model_config = ConfigDict(from_attributes=True)


