"""FastAPI endpoint for AI-assisted claim analysis."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_client import AIConfigurationError, AIProviderError
from app.api.deps import get_db, require_role
from app.models.user import User
from app.schemas.claim_analysis import ClaimAnalysisResponse
from app.services.claim_analysis_service import analyze_claim

router = APIRouter()


@router.post(
    "/{claim_id}/ai-analysis",
    response_model=ClaimAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate AI-assisted claim analysis for agents",
    description=(
        "Analyzes an existing claim using retrieved policy context and database records. "
        "Provides structured findings, risk signals, evidence, and non-binding recommendations for human agent review. "
        "Read-only endpoint that does not modify claim workflow."
    ),
)
async def generate_claim_analysis(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["agent", "admin"])),
) -> ClaimAnalysisResponse:
    try:
        return await analyze_claim(db=db, claim_id=claim_id)
    except HTTPException:
        raise
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
            detail="Claim analysis service encountered an unexpected error.",
        ) from exc
