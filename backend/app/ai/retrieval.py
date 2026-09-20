"""Semantic retrieval service using cosine similarity over cached document embeddings."""

from typing import Optional

import numpy as np

from app.ai.embedding_service import EmbeddingService, get_embedding_service
from app.ai.llm_client import LLMClient, get_llm_client
from app.schemas.knowledge import RetrievalResult


async def retrieve(
    query: str,
    top_k: int = 5,
    policy_type: Optional[str] = None,
    min_similarity: Optional[float] = None,
    llm_client: Optional[LLMClient] = None,
    embedding_service: Optional[EmbeddingService] = None,
) -> list[RetrievalResult]:
    """Retrieve top-K relevant knowledge documents for a query.

    Args:
        query: User query string. Must be non-empty.
        top_k: Maximum number of relevant documents to return (default: 5).
        policy_type: Optional policy type metadata filter (e.g., 'Auto Comprehensive').
        min_similarity: Optional minimum similarity threshold score (0.0 to 1.0).
        llm_client: Optional LLM client override.
        embedding_service: Optional embedding service override.

    Returns:
        List of RetrievalResult objects ranked by similarity in descending order.
    """
    if not query or not query.strip():
        raise ValueError("Query must not be empty or blank.")

    if top_k <= 0:
        raise ValueError("top_k must be a positive integer.")

    service = embedding_service or get_embedding_service()
    client = llm_client or get_llm_client()

    # Load cached document embeddings lazily
    embedded_docs = await service.get_embedded_documents(client=client)
    if not embedded_docs:
        return []

    # Optional pre-filtering by policy_type metadata
    if policy_type and policy_type.strip():
        normalized_policy = policy_type.strip().lower()
        embedded_docs = [
            doc
            for doc in embedded_docs
            if doc.document.policy_type.strip().lower() == normalized_policy
        ]
        if not embedded_docs:
            return []

    # Generate query embedding vector
    raw_query_vector = await client.generate_embedding(query.strip())
    query_vec = np.array(raw_query_vector, dtype=np.float32)

    query_norm = np.linalg.norm(query_vec)
    if query_norm == 0:
        return []

    # Compute batch cosine similarity
    doc_matrix = np.array([doc.vector for doc in embedded_docs], dtype=np.float32)
    doc_norms = np.linalg.norm(doc_matrix, axis=1)

    denom = query_norm * doc_norms
    denom = np.where(denom == 0, 1e-10, denom)
    similarities = np.dot(doc_matrix, query_vec) / denom

    # Pair documents with similarity scores
    scored_results: list[tuple[float, embedded_docs[0]]] = []
    for score, doc in zip(similarities, embedded_docs):
        sim_val = float(score)
        if min_similarity is not None and sim_val < min_similarity:
            continue
        scored_results.append((sim_val, doc))

    # Sort descending by similarity
    scored_results.sort(key=lambda item: item[0], reverse=True)

    # Slice top_k
    top_results = scored_results[:top_k]

    return [
        RetrievalResult(
            document_id=doc.document.id,
            policy_type=doc.document.policy_type,
            title=doc.document.title,
            category=doc.document.category,
            content=doc.document.content,
            source=doc.document.source,
            similarity=round(score, 4),
        )
        for score, doc in top_results
    ]
