"""Service for generating and caching knowledge document embeddings."""

from dataclasses import dataclass
import hashlib
from typing import Optional

import numpy as np

from app.ai.knowledge_loader import load_knowledge_documents
from app.ai.llm_client import LLMClient, get_llm_client
from app.core.config import settings
from app.schemas.knowledge import KnowledgeDocument


@dataclass
class EmbeddedDocument:
    document: KnowledgeDocument
    vector: np.ndarray
    content_hash: str


class EmbeddingService:
    """Manages knowledge base document embeddings with process-level caching."""

    def __init__(self) -> None:
        self._cache: dict[str, EmbeddedDocument] = {}

    def _compute_hash(self, doc: KnowledgeDocument, model: str) -> str:
        raw = f"gemini:{model}:{doc.id}:{doc.content}"
        return hashlib.md5(raw.encode("utf-8")).hexdigest()

    async def get_embedded_documents(
        self, client: Optional[LLMClient] = None, force_reload: bool = False
    ) -> list[EmbeddedDocument]:
        """Load knowledge documents and return their embedding vectors.

        Uses in-memory process cache to prevent redundant Gemini API calls.
        """
        llm_client = client or get_llm_client()
        docs = load_knowledge_documents()
        model = settings.GEMINI_EMBEDDING_MODEL

        if not force_reload and len(self._cache) == len(docs):
            all_valid = True
            for doc in docs:
                expected_hash = self._compute_hash(doc, model)
                cached = self._cache.get(doc.id)
                if not cached or cached.content_hash != expected_hash:
                    all_valid = False
                    break
            if all_valid:
                return [self._cache[doc.id] for doc in docs]

        docs_to_embed: list[KnowledgeDocument] = []
        hashes_to_embed: list[str] = []

        for doc in docs:
            expected_hash = self._compute_hash(doc, model)
            cached = self._cache.get(doc.id)
            if force_reload or not cached or cached.content_hash != expected_hash:
                docs_to_embed.append(doc)
                hashes_to_embed.append(expected_hash)

        if docs_to_embed:
            texts = [doc.content for doc in docs_to_embed]
            raw_embeddings = await llm_client.generate_embeddings(texts)

            for doc, raw_vec, content_hash in zip(
                docs_to_embed, raw_embeddings, hashes_to_embed
            ):
                vec = np.array(raw_vec, dtype=np.float32)
                self._cache[doc.id] = EmbeddedDocument(
                    document=doc,
                    vector=vec,
                    content_hash=content_hash,
                )

        return [self._cache[doc.id] for doc in docs]

    def clear_cache(self) -> None:
        """Clear in-memory embedding cache (useful for testing)."""
        self._cache.clear()


_embedding_service = EmbeddingService()


def get_embedding_service() -> EmbeddingService:
    return _embedding_service
