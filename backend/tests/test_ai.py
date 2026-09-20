import pytest
from httpx import AsyncClient
from google.genai.errors import APIError
from pydantic import SecretStr

from app.ai.llm_client import AIConfigurationError, AIProviderError, LLMClient
from app.core.config import Settings, settings
from app.services import ai_service


class FakeContentResponse:
    def __init__(self, text=None):
        self.text = text


class FakeModelsAPI:
    def __init__(self, result=None, error=None):
        self.result = result
        self.error = error

    async def generate_content(self, **kwargs):
        if self.error:
            raise self.error
        return self.result


class FakeAIO:
    def __init__(self, result=None, error=None):
        self.models = FakeModelsAPI(result=result, error=error)


class FakeGeminiClient:
    def __init__(self, result=None, error=None):
        self.aio = FakeAIO(result=result, error=error)


class FakeAIServiceClient:
    async def generate_text(self, prompt: str) -> str:
        assert prompt == "Prompt"
        return "Generated text"


class ProviderFailure(APIError):
    def __init__(self, message):
        super().__init__(code=500, response_json={"message": message})


@pytest.mark.asyncio
async def test_ai_endpoint_rejects_unauthenticated_request(client: AsyncClient):
    response = await client.post("/api/v1/ai/test", json={"prompt": "Hello"})
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_ai_endpoint_validates_empty_and_oversized_prompts(client: AsyncClient):
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "agent@demo.com", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['token']}"}

    empty = await client.post("/api/v1/ai/test", json={"prompt": ""}, headers=headers)
    oversized = await client.post(
        "/api/v1/ai/test", json={"prompt": "x" * 2001}, headers=headers
    )

    assert empty.status_code == 422
    assert oversized.status_code == 422


@pytest.mark.asyncio
async def test_authenticated_request_reaches_ai_service(client: AsyncClient, monkeypatch):
    async def fake_generate_text(prompt: str) -> str:
        assert prompt == "Say hello"
        return "Hello."

    monkeypatch.setattr("app.api.v1.endpoints.ai.generate_text", fake_generate_text)
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "agent@demo.com", "password": "password123"},
    )
    response = await client.post(
        "/api/v1/ai/test",
        json={"prompt": "Say hello"},
        headers={"Authorization": f"Bearer {login.json()['token']}"},
    )

    assert response.status_code == 200
    assert response.json() == {"response": "Hello."}


@pytest.mark.asyncio
async def test_ai_endpoint_returns_safe_configuration_error(client: AsyncClient, monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", None)
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "agent@demo.com", "password": "password123"},
    )
    response = await client.post(
        "/api/v1/ai/test",
        json={"prompt": "Hello"},
        headers={"Authorization": f"Bearer {login.json()['token']}"},
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "AI service is not configured."}


@pytest.mark.asyncio
async def test_ai_service_returns_mocked_gemini_response(monkeypatch):
    fake_client = FakeAIServiceClient()
    monkeypatch.setattr(ai_service, "get_llm_client", lambda: fake_client)

    assert await ai_service.generate_text("Prompt") == "Generated text"


@pytest.mark.asyncio
async def test_llm_client_handles_missing_configuration(monkeypatch):
    client = LLMClient()
    monkeypatch.setattr(settings, "GEMINI_API_KEY", None)

    with pytest.raises(AIConfigurationError, match="AI service is not configured"):
        await client.generate_text("Prompt")


@pytest.mark.asyncio
async def test_llm_client_returns_provider_safe_error(monkeypatch):
    client = LLMClient()
    monkeypatch.setattr(settings, "GEMINI_API_KEY", SecretStr("test-key"))
    client._client = FakeGeminiClient(error=ProviderFailure("sensitive provider detail"))

    with pytest.raises(AIProviderError, match="AI service request failed"):
        await client.generate_text("Prompt")


def test_settings_allow_application_start_without_api_key():
    configured = Settings(_env_file=None, GEMINI_API_KEY=None)
    secret_configured = Settings(
        _env_file=None, GEMINI_API_KEY=SecretStr("test-secret-value")
    )

    assert configured.GEMINI_API_KEY is None
    assert "test-secret-value" not in repr(secret_configured)

