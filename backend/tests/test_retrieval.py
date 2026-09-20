import pytest
import numpy as np
from httpx import AsyncClient
from google.genai.errors import APIError
from pydantic import SecretStr

from app.ai.embedding_service import EmbeddingService, get_embedding_service
from app.ai.llm_client import AIConfigurationError, AIProviderError, LLMClient
from app.ai.retrieval import retrieve
from app.ai.knowledge_loader import load_knowledge_documents
from app.core.config import settings
from app.schemas.knowledge import KnowledgeDocument, RetrievalResult


class FakeEmbeddingItem:
    def __init__(self, values: list[float]):
        self.values = values


class FakeEmbeddingResponse:
    def __init__(self, embeddings: list[FakeEmbeddingItem]):
        self.embeddings = embeddings


class FakeEmbeddingsAPI:
    def __init__(self, response=None, error=None):
        self.response = response
        self.error = error

    async def embed_content(self, **kwargs):
        if self.error:
            raise self.error
        return self.response


class FakeAIO:
    def __init__(self, response=None, error=None):
        self.models = FakeEmbeddingsAPI(response=response, error=error)


class FakeGeminiClientWithEmbeddings:
    def __init__(self, response=None, error=None):
        self.aio = FakeAIO(response=response, error=error)


class ProviderFailure(APIError):
    def __init__(self, message):
        super().__init__(code=500, response_json={"message": message})


@pytest.fixture(autouse=True)
def reset_embedding_cache():
    get_embedding_service().clear_cache()
    yield
    get_embedding_service().clear_cache()


# ---------------------------------------------------------------------------
# 1. Embedding Client Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_llm_client_generate_embedding_success(monkeypatch):
    client = LLMClient()
    monkeypatch.setattr(settings, "GEMINI_API_KEY", SecretStr("test-key"))

    fake_vec = [0.1, 0.2, 0.3]
    fake_resp = FakeEmbeddingResponse([FakeEmbeddingItem(fake_vec)])
    client._client = FakeGeminiClientWithEmbeddings(response=fake_resp)

    res = await client.generate_embedding("Windshield coverage query")
    assert res == fake_vec


@pytest.mark.asyncio
async def test_llm_client_generate_embeddings_batch(monkeypatch):
    client = LLMClient()
    monkeypatch.setattr(settings, "GEMINI_API_KEY", SecretStr("test-key"))

    vec1 = [0.1, 0.2]
    vec2 = [0.3, 0.4]
    fake_resp = FakeEmbeddingResponse(
        [FakeEmbeddingItem(vec1), FakeEmbeddingItem(vec2)]
    )
    client._client = FakeGeminiClientWithEmbeddings(response=fake_resp)

    res = await client.generate_embeddings(["text 1", "text 2"])
    assert res == [vec1, vec2]


@pytest.mark.asyncio
async def test_llm_client_embedding_rejects_empty_inputs():
    client = LLMClient()

    with pytest.raises(ValueError, match="must not be empty"):
        await client.generate_embedding("")

    with pytest.raises(ValueError, match="must not be empty"):
        await client.generate_embedding("   ")

    with pytest.raises(ValueError, match="must not be empty"):
        await client.generate_embeddings(["valid", "  "])


@pytest.mark.asyncio
async def test_llm_client_embedding_missing_configuration(monkeypatch):
    client = LLMClient()
    monkeypatch.setattr(settings, "GEMINI_API_KEY", None)

    with pytest.raises(AIConfigurationError, match="AI service is not configured"):
        await client.generate_embedding("test prompt")


@pytest.mark.asyncio
async def test_llm_client_embedding_provider_failure(monkeypatch):
    client = LLMClient()
    monkeypatch.setattr(settings, "GEMINI_API_KEY", SecretStr("test-key"))
    client._client = FakeGeminiClientWithEmbeddings(
        error=ProviderFailure("sensitive internal detail")
    )

    with pytest.raises(AIProviderError, match="AI service request failed"):
        await client.generate_embedding("test prompt")


# ---------------------------------------------------------------------------
# 2. Retrieval & Cosine Similarity Tests
# ---------------------------------------------------------------------------

class DeterministicMockLLMClient:
    """Returns deterministic embedding vectors for testing semantic retrieval."""

    def __init__(self, dimension: int = 16):
        self.dimension = dimension
        self.call_count_embeddings = 0
        self.call_count_query = 0

    async def generate_embedding(self, text: str) -> list[float]:
        self.call_count_query += 1
        return self._vector_for_text(text)

    async def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        self.call_count_embeddings += 1
        return [self._vector_for_text(t) for t in texts]

    def _vector_for_text(self, text: str) -> list[float]:
        import zlib
        text_lower = text.lower()
        vec = np.zeros(self.dimension, dtype=np.float32)

        if any(w in text_lower for w in ("windshield", "glass", "car", "auto", "vehicle", "comprehensive")):
            vec[0] = 1.0
            vec[1] = 0.8
        elif any(w in text_lower for w in ("homeowner", "exclusion", "property", "dwelling")):
            vec[2] = 1.0
            vec[3] = 0.8
        elif any(w in text_lower for w in ("health", "document", "medical")):
            vec[4] = 1.0
            vec[5] = 0.8
        else:
            crc = zlib.crc32(text_lower.encode("utf-8"))
            vec[0] = (crc % 100) / 100.0 + 0.1

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()


@pytest.mark.asyncio
async def test_retrieval_returns_top_k_ranked_results():
    mock_client = DeterministicMockLLMClient()
    service = EmbeddingService()

    results = await retrieve(
        query="Will my car insurance cover a broken windshield?",
        top_k=3,
        llm_client=mock_client,
        embedding_service=service,
    )

    assert len(results) <= 3
    assert all(isinstance(r, RetrievalResult) for r in results)
    # Check descending order of similarity
    similarities = [r.similarity for r in results]
    assert similarities == sorted(similarities, reverse=True)
    # Metadata preserved
    top = results[0]
    assert top.document_id
    assert top.policy_type
    assert top.title
    assert top.category
    assert top.source
    assert top.content


@pytest.mark.asyncio
async def test_retrieval_policy_type_filtering():
    mock_client = DeterministicMockLLMClient()
    service = EmbeddingService()

    results = await retrieve(
        query="auto comprehensive coverage claim guidelines",
        top_k=5,
        policy_type="Auto Comprehensive",
        llm_client=mock_client,
        embedding_service=service,
    )

    assert len(results) > 0
    for r in results:
        assert r.policy_type == "Auto Comprehensive"



@pytest.mark.asyncio
async def test_retrieval_min_similarity_threshold():
    mock_client = DeterministicMockLLMClient()
    service = EmbeddingService()

    results_high = await retrieve(
        query="Will my car insurance cover a broken windshield?",
        top_k=10,
        min_similarity=0.99,
        llm_client=mock_client,
        embedding_service=service,
    )

    for r in results_high:
        assert r.similarity >= 0.99


# ---------------------------------------------------------------------------
# 3. Cache Strategy Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_embedding_service_caches_knowledge_documents():
    mock_client = DeterministicMockLLMClient()
    service = EmbeddingService()

    # First retrieval: computes embeddings for all 25 docs + 1 query
    res1 = await retrieve(
        query="car windshield",
        top_k=3,
        llm_client=mock_client,
        embedding_service=service,
    )
    assert len(res1) > 0
    assert mock_client.call_count_embeddings == 1
    assert mock_client.call_count_query == 1

    # Second retrieval with new query: reuses cached doc embeddings, calls query embedding only
    res2 = await retrieve(
        query="homeowners exclusions",
        top_k=3,
        llm_client=mock_client,
        embedding_service=service,
    )
    assert len(res2) > 0
    assert mock_client.call_count_embeddings == 1  # Unchanged! Cache was used.
    assert mock_client.call_count_query == 2       # Query embedding generated.


# ---------------------------------------------------------------------------
# 4. Edge Cases Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_retrieval_rejects_empty_or_whitespace_queries():
    with pytest.raises(ValueError, match="Query must not be empty"):
        await retrieve(query="")

    with pytest.raises(ValueError, match="Query must not be empty"):
        await retrieve(query="   \n  ")


@pytest.mark.asyncio
async def test_retrieval_rejects_invalid_top_k():
    with pytest.raises(ValueError, match="top_k must be a positive integer"):
        await retrieve(query="windshield", top_k=0)

    with pytest.raises(ValueError, match="top_k must be a positive integer"):
        await retrieve(query="windshield", top_k=-5)


@pytest.mark.asyncio
async def test_retrieval_handles_empty_knowledge_base(monkeypatch):
    mock_client = DeterministicMockLLMClient()
    service = EmbeddingService()

    monkeypatch.setattr("app.ai.embedding_service.load_knowledge_documents", lambda: [])

    results = await retrieve(
        query="windshield",
        llm_client=mock_client,
        embedding_service=service,
    )
    assert results == []


# ---------------------------------------------------------------------------
# 5. Semantic Quality Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_semantic_quality_glass_windshield_query():
    mock_client = DeterministicMockLLMClient()
    service = EmbeddingService()

    results = await retrieve(
        query="Will my car insurance cover a broken windshield?",
        top_k=3,
        llm_client=mock_client,
        embedding_service=service,
    )

    assert len(results) > 0
    # Expected top result should be Auto Comprehensive / Glass related document
    top_doc = results[0]
    assert "auto" in top_doc.policy_type.lower() or "glass" in top_doc.title.lower() or "windshield" in top_doc.title.lower()


@pytest.mark.asyncio
async def test_semantic_quality_homeowners_exclusions_query():
    mock_client = DeterministicMockLLMClient()
    service = EmbeddingService()

    results = await retrieve(
        query="What exclusions apply to my homeowners policy?",
        top_k=3,
        llm_client=mock_client,
        embedding_service=service,
    )

    assert len(results) > 0
    top_doc = results[0]
    assert "homeowner" in top_doc.policy_type.lower() or top_doc.category == "exclusions"


@pytest.mark.asyncio
async def test_semantic_quality_health_documentation_query():
    mock_client = DeterministicMockLLMClient()
    service = EmbeddingService()

    results = await retrieve(
        query="What documents are needed for a health claim?",
        top_k=3,
        llm_client=mock_client,
        embedding_service=service,
    )

    assert len(results) > 0
    top_doc = results[0]
    assert "health" in top_doc.policy_type.lower() or top_doc.category in ("documentation", "claims")


# ---------------------------------------------------------------------------
# 6. Internal API Endpoint Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_retrieval_endpoint_unauthenticated(client: AsyncClient):
    response = await client.post(
        "/api/v1/ai/retrieve",
        json={"query": "windshield coverage", "top_k": 3},
    )
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_retrieval_endpoint_authenticated(client: AsyncClient, monkeypatch):
    async def fake_retrieve(query: str, top_k: int = 5, policy_type=None, min_similarity=None):
        return [
            RetrievalResult(
                document_id="auto-comprehensive-glass",
                policy_type="Auto Comprehensive",
                title="Windshield and Glass Coverage",
                category="coverage",
                content="Comprehensive auto insurance covers windshield damage.",
                source="demo-policy-guidelines",
                similarity=0.92,
            )
        ]

    monkeypatch.setattr("app.api.v1.endpoints.ai.retrieve", fake_retrieve)

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "agent@demo.com", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['token']}"}

    response = await client.post(
        "/api/v1/ai/retrieve",
        json={"query": "windshield damage", "top_k": 3},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) == 1
    assert data["results"][0]["document_id"] == "auto-comprehensive-glass"
    assert data["results"][0]["similarity"] == 0.92
