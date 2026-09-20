import pytest
from httpx import AsyncClient
from pydantic import SecretStr

from app.ai.llm_client import AIConfigurationError, AIProviderError, LLMClient
from app.core.config import settings
from app.schemas.knowledge import RetrievalResult
from app.services.assistant_service import (
    FALLBACK_NO_KNOWLEDGE_RESPONSE,
    ask_assistant,
    build_grounded_prompt,
)


def sample_retrieval_sources() -> list[RetrievalResult]:
    return [
        RetrievalResult(
            document_id="auto-comprehensive-coverage",
            policy_type="Auto Comprehensive",
            title="Auto Comprehensive Coverage",
            category="coverage",
            content="Auto Comprehensive guidelines cover accidental damage, theft, and weather events.",
            source="demo-policy-guidelines",
            similarity=0.88,
        )
    ]


class MockAssistantLLMClient:
    def __init__(self, answer: str = "Mocked LLM answer about Auto Comprehensive coverage."):
        self.answer = answer
        self.last_prompt = None
        self.call_count = 0

    async def generate_text(self, prompt: str) -> str:
        self.last_prompt = prompt
        self.call_count += 1
        return self.answer

    async def generate_embedding(self, text: str) -> list[float]:
        return [0.1] * 16

    async def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        return [[0.1] * 16 for _ in texts]


# ---------------------------------------------------------------------------
# 1. Assistant Service Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ask_assistant_orchestrates_rag_flow(monkeypatch):
    mock_llm = MockAssistantLLMClient()
    sources = sample_retrieval_sources()

    async def fake_retrieve(query, top_k=5, policy_type=None, llm_client=None, embedding_service=None):
        assert query == "What is covered under auto comprehensive?"
        assert top_k == 3
        assert policy_type == "Auto Comprehensive"
        return sources

    monkeypatch.setattr("app.services.assistant_service.retrieve", fake_retrieve)

    response = await ask_assistant(
        message="What is covered under auto comprehensive?",
        policy_type="Auto Comprehensive",
        top_k=3,
        llm_client=mock_llm,
    )

    assert response.answer == "Mocked LLM answer about Auto Comprehensive coverage."
    assert len(response.sources) == 1
    assert response.sources[0].document_id == "auto-comprehensive-coverage"
    assert mock_llm.call_count == 1
    assert "RETRIEVED INSURANCE POLICY KNOWLEDGE CONTEXT" in mock_llm.last_prompt
    assert "Auto Comprehensive guidelines cover accidental damage" in mock_llm.last_prompt


@pytest.mark.asyncio
async def test_ask_assistant_returns_fallback_when_no_documents_retrieved(monkeypatch):
    mock_llm = MockAssistantLLMClient()

    async def fake_retrieve(query, top_k=5, policy_type=None, llm_client=None, embedding_service=None):
        return []

    monkeypatch.setattr("app.services.assistant_service.retrieve", fake_retrieve)

    response = await ask_assistant(
        message="Unrelated query without policy match",
        llm_client=mock_llm,
    )

    assert response.answer == FALLBACK_NO_KNOWLEDGE_RESPONSE
    assert response.sources == []
    # Verify LLM was NOT called unnecessarily
    assert mock_llm.call_count == 0


@pytest.mark.asyncio
async def test_ask_assistant_rejects_empty_and_blank_messages():
    with pytest.raises(ValueError, match="Message must not be blank"):
        await ask_assistant(message="")

    with pytest.raises(ValueError, match="Message must not be blank"):
        await ask_assistant(message="   \n  ")


def test_build_grounded_prompt_formats_documents_and_rules():
    sources = sample_retrieval_sources()
    prompt = build_grounded_prompt("What is covered?", sources)

    assert "You are an insurance policy information assistant" in prompt
    assert "RETRIEVED INSURANCE POLICY KNOWLEDGE CONTEXT:" in prompt
    assert "auto-comprehensive-coverage" in prompt
    assert "USER QUESTION:\nWhat is covered?" in prompt


# ---------------------------------------------------------------------------
# 2. Assistant API Endpoint Authorization & Authentication Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_assistant_endpoint_rejects_unauthenticated_request(client: AsyncClient):
    response = await client.post(
        "/api/v1/assistant/chat",
        json={"message": "What is covered?"},
    )
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_authenticated_customer_can_call_assistant(client: AsyncClient, monkeypatch):
    async def fake_ask_assistant(message, policy_type=None, top_k=5):
        return {
            "answer": "Customer response answer",
            "sources": [
                {
                    "document_id": "auto-coverage-1",
                    "policy_type": "Auto Comprehensive",
                    "title": "Coverage Title",
                    "category": "coverage",
                    "content": "Coverage details",
                    "source": "demo-source",
                    "similarity": 0.85,
                }
            ],
            "model": "gpt-5-mini",
        }

    monkeypatch.setattr("app.api.v1.endpoints.assistant.ask_assistant", fake_ask_assistant)

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "customer@demo.com", "password": "password123"},
    )
    token = login.json()["token"]

    response = await client.post(
        "/api/v1/assistant/chat",
        json={"message": "What is covered under auto insurance?"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["answer"] == "Customer response answer"
    assert len(data["sources"]) == 1
    assert data["sources"][0]["document_id"] == "auto-coverage-1"


@pytest.mark.asyncio
async def test_authenticated_agent_can_call_assistant(client: AsyncClient, monkeypatch):
    async def fake_ask_assistant(message, policy_type=None, top_k=5):
        return {
            "answer": "Agent response answer",
            "sources": [],
            "model": "gpt-5-mini",
        }

    monkeypatch.setattr("app.api.v1.endpoints.assistant.ask_assistant", fake_ask_assistant)

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "agent@demo.com", "password": "password123"},
    )
    token = login.json()["token"]

    response = await client.post(
        "/api/v1/assistant/chat",
        json={"message": "What exclusions apply to home policy?"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["answer"] == "Agent response answer"


# ---------------------------------------------------------------------------
# 3. Request Validation Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_assistant_endpoint_validates_request_fields(client: AsyncClient):
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "customer@demo.com", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['token']}"}

    empty_msg = await client.post(
        "/api/v1/assistant/chat",
        json={"message": ""},
        headers=headers,
    )
    whitespace_msg = await client.post(
        "/api/v1/assistant/chat",
        json={"message": "   "},
        headers=headers,
    )
    oversized_msg = await client.post(
        "/api/v1/assistant/chat",
        json={"message": "a" * 2001},
        headers=headers,
    )
    invalid_top_k = await client.post(
        "/api/v1/assistant/chat",
        json={"message": "Valid query", "top_k": 0},
        headers=headers,
    )

    assert empty_msg.status_code == 422
    assert whitespace_msg.status_code == 422
    assert oversized_msg.status_code == 422
    assert invalid_top_k.status_code == 422


# ---------------------------------------------------------------------------
# 4. Error Handling & Security Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_assistant_endpoint_handles_unconfigured_ai_safely(client: AsyncClient, monkeypatch):
    async def fake_ask_assistant(message, policy_type=None, top_k=5):
        raise AIConfigurationError("AI service is not configured.")

    monkeypatch.setattr("app.api.v1.endpoints.assistant.ask_assistant", fake_ask_assistant)

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "customer@demo.com", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['token']}"}

    response = await client.post(
        "/api/v1/assistant/chat",
        json={"message": "What is covered?"},
        headers=headers,
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "AI service is not configured."}


@pytest.mark.asyncio
async def test_assistant_endpoint_handles_provider_failure_safely(client: AsyncClient, monkeypatch):
    async def fake_ask_assistant(message, policy_type=None, top_k=5):
        raise AIProviderError("AI service is temporarily unavailable.")

    monkeypatch.setattr("app.api.v1.endpoints.assistant.ask_assistant", fake_ask_assistant)

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "customer@demo.com", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['token']}"}

    response = await client.post(
        "/api/v1/assistant/chat",
        json={"message": "What is covered?"},
        headers=headers,
    )

    assert response.status_code == 502
    assert response.json() == {"detail": "AI service is temporarily unavailable."}


@pytest.mark.asyncio
async def test_assistant_response_does_not_expose_system_prompts_or_secrets(client: AsyncClient, monkeypatch):
    mock_llm = MockAssistantLLMClient("Public informational answer about policy coverage.")

    async def fake_retrieve(query, top_k=5, policy_type=None, llm_client=None, embedding_service=None):
        return sample_retrieval_sources()

    monkeypatch.setattr("app.services.assistant_service.retrieve", fake_retrieve)
    monkeypatch.setattr("app.services.assistant_service.get_llm_client", lambda: mock_llm)


    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "customer@demo.com", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['token']}"}

    response = await client.post(
        "/api/v1/assistant/chat",
        json={"message": "What is covered?"},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert "You are an insurance policy information assistant" not in data["answer"]
    assert "SECRET_KEY" not in str(data)
    assert "GEMINI_API_KEY" not in str(data)
