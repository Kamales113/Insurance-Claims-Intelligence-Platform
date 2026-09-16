from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user, require_role
from app.models.user import User
from app.schemas.claim import (
    ClaimCreate,
    ClaimResponse,
    ClaimStatusUpdate,
    AgentClaimWithCustomerResponse,
)
from app.schemas.agent import AgentClaimSummaryResponse
from app.schemas.history import ClaimStatusHistoryResponse
from app.schemas.document import ClaimDocumentResponse
from app.services.customer_service import get_customer_by_user_id
from app.services.claim_service import (
    get_claims,
    get_claim_by_id,
    submit_claim,
    update_claim_status,
    get_claim_history,
    get_claim_documents,
    get_agent_claim_summary,
)

router = APIRouter()


@router.get(
    "",
    response_model=List[AgentClaimWithCustomerResponse],
    status_code=status.HTTP_200_OK,
    summary="List claims",
    description="Retrieve claims, filtered by customer, policy, or requiring attention.",
)
async def list_claims(
    customer_id: Optional[str] = None,
    policy_id: Optional[str] = None,
    requiring_attention: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[AgentClaimWithCustomerResponse]:
    target_customer_id = customer_id
    if current_user.role == "customer":
        customer = await get_customer_by_user_id(db, current_user.id)
        if not customer:
            return []
        target_customer_id = customer.id

    return await get_claims(
        db,
        customer_id=target_customer_id,
        policy_id=policy_id,
        requiring_attention=requiring_attention,
    )


@router.get(
    "/summary",
    response_model=AgentClaimSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get agent claim summary metrics",
    description="Retrieve system-wide claim summary metrics (total, pending review, under investigation, fraud alerts) for agents.",
)
async def get_agent_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["agent", "admin"])),
) -> AgentClaimSummaryResponse:
    return await get_agent_claim_summary(db)


@router.get(
    "/{id}",
    response_model=ClaimResponse,
    status_code=status.HTTP_200_OK,
    summary="Get claim details",
    description="Retrieve specific claim details by ID.",
)
async def get_claim(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClaimResponse:
    claim = await get_claim_by_id(db, id)
    if current_user.role == "customer":
        customer = await get_customer_by_user_id(db, current_user.id)
        if not customer or claim.customer_id != customer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to requested claim",
            )
    return claim


@router.post(
    "",
    response_model=ClaimResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a claim",
    description="Submit a new insurance claim as a customer policyholder.",
)
async def create_claim(
    claim_in: ClaimCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["customer"])),
) -> ClaimResponse:
    customer = await get_customer_by_user_id(db, current_user.id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found for authenticated user",
        )
    return await submit_claim(
        db, customer_id=customer.id, user_id=current_user.id, claim_in=claim_in
    )


@router.patch(
    "/{id}/status",
    response_model=ClaimResponse,
    status_code=status.HTTP_200_OK,
    summary="Update claim status",
    description="Update workflow status of a claim and append a history record (Agent/Admin only).",
)
async def update_status(
    id: str,
    status_in: ClaimStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["agent", "admin"])),
) -> ClaimResponse:
    return await update_claim_status(
        db,
        claim_id=id,
        status_name=status_in.status,
        notes=status_in.notes,
        user_id=current_user.id,
    )


@router.get(
    "/{id}/history",
    response_model=List[ClaimStatusHistoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get claim status history",
    description="Retrieve full audit history timeline of status transitions for a claim.",
)
async def get_history(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ClaimStatusHistoryResponse]:
    claim = await get_claim_by_id(db, id)
    if current_user.role == "customer":
        customer = await get_customer_by_user_id(db, current_user.id)
        if not customer or claim.customer_id != customer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to requested claim history",
            )
    return await get_claim_history(db, id)


@router.get(
    "/{id}/documents",
    response_model=List[ClaimDocumentResponse],
    status_code=status.HTTP_200_OK,
    summary="Get claim supporting documents",
    description="Retrieve list of supporting document metadata attached to a claim.",
)
async def get_documents(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ClaimDocumentResponse]:
    claim = await get_claim_by_id(db, id)
    if current_user.role == "customer":
        customer = await get_customer_by_user_id(db, current_user.id)
        if not customer or claim.customer_id != customer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to requested claim documents",
            )
    return await get_claim_documents(db, id)
