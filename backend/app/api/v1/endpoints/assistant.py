"""FastAPI endpoint for the Insurance Policy Assistant."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.ai.llm_client import AIConfigurationError, AIProviderError
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.assistant_service import ask_assistant

router = APIRouter()


@router.post(
    "/chat",
    response_model=AssistantChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask Insurance Policy Assistant",
    description=(
        "Answers insurance policy questions grounded strictly in the demo policy knowledge base. "
        "Returns informational answers along with structured source metadata. "
        "Does not make binding coverage determinations."
    ),
)
async def chat_assistant(
    request: AssistantChatRequest,
    current_user: User = Depends(get_current_user),
) -> AssistantChatResponse:
    try:
        return await ask_assistant(
            message=request.message,
            policy_type=request.policy_type,
            top_k=request.top_k,
        )
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
            detail="Assistant service encountered an unexpected error.",
        ) from exc
