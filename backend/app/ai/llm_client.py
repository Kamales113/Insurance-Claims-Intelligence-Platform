"""Minimal, provider-specific Google Gemini client wrapper."""

import json
from typing import Optional

from google import genai
from google.genai import errors

from app.core.config import settings


class AIClientError(Exception):
    """Base exception whose message is safe to return from the application."""


class AIConfigurationError(AIClientError):
    """Raised when the AI provider has not been configured."""


class AIProviderError(AIClientError):
    """Raised when the AI provider cannot fulfil a request."""


class LLMClient:
    """Lazily creates and reuses the asynchronous Google Gemini SDK client."""

    def __init__(self) -> None:
        self._client: Optional[genai.Client] = None

    def _get_client(self) -> genai.Client:
        api_key = (
            settings.GEMINI_API_KEY.get_secret_value()
            if settings.GEMINI_API_KEY
            else None
        )
        if not api_key:
            raise AIConfigurationError("AI service is not configured.")

        if self._client is None:
            self._client = genai.Client(api_key=api_key)
        return self._client

    async def generate_text(self, prompt: str) -> str:
        """Generate text while translating provider failures to safe application errors."""
        client = self._get_client()
        try:
            if hasattr(client, "aio") and hasattr(client.aio, "models"):
                response = await client.aio.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                )
            else:
                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                )
        except AIConfigurationError:
            raise
        except errors.APIError as exc:
            if getattr(exc, "code", None) in (401, 403) or "API key" in str(exc):
                raise AIProviderError("AI service authentication failed.") from exc
            raise AIProviderError("AI service request failed.") from exc
        except Exception as exc:
            raise AIProviderError("AI service request failed.") from exc

        text = getattr(response, "text", None)
        if not text:
            raise AIProviderError("AI service returned an empty response.")
        return text

    async def generate_json(self, prompt: str) -> dict:
        """Generate text and parse as a structured JSON object safely."""
        raw_text = await self.generate_text(prompt)
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            data = json.loads(cleaned)
            if not isinstance(data, dict):
                raise AIProviderError("AI service returned non-dictionary JSON response.")
            return data
        except json.JSONDecodeError as exc:
            raise AIProviderError("AI service returned invalid JSON response.") from exc

    async def generate_embedding(self, text: str) -> list[float]:
        """Generate a numeric embedding vector for a single text string."""
        if not text or not text.strip():
            raise ValueError("Text for embedding generation must not be empty.")

        embeddings = await self.generate_embeddings([text])
        return embeddings[0]

    async def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Generate numeric embedding vectors for a batch of text strings."""
        if not texts:
            return []
        for text in texts:
            if not text or not text.strip():
                raise ValueError("Text for embedding generation must not be empty.")

        client = self._get_client()
        try:
            if hasattr(client, "aio") and hasattr(client.aio, "models"):
                response = await client.aio.models.embed_content(
                    model=settings.GEMINI_EMBEDDING_MODEL,
                    contents=texts,
                )
            else:
                response = client.models.embed_content(
                    model=settings.GEMINI_EMBEDDING_MODEL,
                    contents=texts,
                )
        except AIConfigurationError:
            raise
        except errors.APIError as exc:
            if getattr(exc, "code", None) in (401, 403) or "API key" in str(exc):
                raise AIProviderError("AI service authentication failed.") from exc
            raise AIProviderError("AI service request failed.") from exc
        except Exception as exc:
            raise AIProviderError("AI service request failed.") from exc

        if not response or not hasattr(response, "embeddings") or not response.embeddings:
            raise AIProviderError("AI service returned an empty embedding response.")

        embeddings = []
        for item in response.embeddings:
            values = getattr(item, "values", None)
            if values is None:
                raise AIProviderError("AI service returned malformed embedding data.")
            embeddings.append(list(values))
        return embeddings


_llm_client = LLMClient()


def get_llm_client() -> LLMClient:
    return _llm_client

