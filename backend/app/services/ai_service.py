"""Application-facing abstraction for AI text generation and semantic retrieval."""

from typing import Optional

from app.ai.llm_client import get_llm_client
from app.ai.retrieval import retrieve as ai_retrieve
from app.schemas.knowledge import RetrievalResult


async def generate_text(prompt: str) -> str:
    return await get_llm_client().generate_text(prompt)


async def retrieve(
    query: str,
    top_k: int = 5,
    policy_type: Optional[str] = None,
    min_similarity: Optional[float] = None,
) -> list[RetrievalResult]:
    """Application-level semantic retrieval function."""
    return await ai_retrieve(
        query=query,
        top_k=top_k,
        policy_type=policy_type,
        min_similarity=min_similarity,
    )

