from fastapi import APIRouter, Depends, HTTPException, status

from app.ai.llm_client import AIConfigurationError, AIProviderError
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.ai import (
    AIRetrievalRequest,
    AIRetrievalResponse,
    AITestRequest,
    AITestResponse,
)
from app.services.ai_service import generate_text, retrieve

router = APIRouter()


@router.post(
    "/test",
    response_model=AITestResponse,
    status_code=status.HTTP_200_OK,
    summary="Test AI connectivity",
    description="Send a short prompt through the configured AI provider.",
)
async def test_ai(
    request: AITestRequest,
    current_user: User = Depends(get_current_user),
) -> AITestResponse:
    try:
        response = await generate_text(request.prompt)
        return AITestResponse(response=response)
    except AIConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    except AIProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI service encountered an unexpected error.",
        ) from exc


@router.post(
    "/retrieve",
    response_model=AIRetrievalResponse,
    status_code=status.HTTP_200_OK,
    summary="Internal semantic retrieval test endpoint",
    description="Retrieve relevant knowledge base documents for a given query (Internal test endpoint).",
)
async def test_retrieve(
    request: AIRetrievalRequest,
    current_user: User = Depends(get_current_user),
) -> AIRetrievalResponse:
    try:
        results = await retrieve(
            query=request.query,
            top_k=request.top_k,
            policy_type=request.policy_type,
        )
        return AIRetrievalResponse(results=results)
    except AIConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    except AIProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI retrieval service encountered an unexpected error.",
        ) from exc

