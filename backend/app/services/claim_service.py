import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, func, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.claim import Claim
from app.models.policy import Policy
from app.models.customer import Customer
from app.models.user import User
from app.models.history import ClaimStatusHistory
from app.models.document import ClaimDocument
from app.schemas.claim import (
    ClaimCreate,
    ClaimResponse,
    AgentClaimWithCustomerResponse,
)
from app.schemas.history import ClaimStatusHistoryResponse
from app.schemas.document import ClaimDocumentResponse
from app.schemas.agent import AgentClaimSummaryResponse

VALID_CLAIM_STATUSES = [
    "SUBMITTED",
    "DOCUMENT_VERIFICATION",
    "POLICY_VALIDATION",
    "UNDER_INVESTIGATION",
    "FRAUD_ASSESSMENT",
    "APPROVAL",
    "PAYMENT_PENDING",
    "PAID",
    "REJECTED",
]


async def enrich_claim_with_customer(
    db: AsyncSession, claim: Claim
) -> AgentClaimWithCustomerResponse:
    pol_res = await db.execute(select(Policy).where(Policy.id == claim.policy_id))
    policy = pol_res.scalars().first()

    cust_res = await db.execute(
        select(Customer).options(selectinload(Customer.user)).where(Customer.id == claim.customer_id)
    )
    customer = cust_res.scalars().first()
    user = customer.user if customer else None

    customer_name = f"{user.first_name} {user.last_name}" if user else "Unknown customer"
    customer_email = user.email if user else ""
    policy_type = policy.type if policy else "General Policy"
    policy_number = policy.policy_number if policy else "N/A"

    return AgentClaimWithCustomerResponse(
        id=claim.id,
        claim_number=claim.claim_number,
        customer_id=claim.customer_id,
        policy_id=claim.policy_id,
        status=claim.status,
        incident_date=claim.incident_date,
        submitted_at=claim.submitted_at,
        description=claim.description,
        claim_amount=claim.claim_amount,
        assigned_agent_id=claim.assigned_agent_id,
        updated_at=claim.updated_at,
        policy_type=policy_type,
        policy_number=policy_number,
        customer_name=customer_name,
        customer_email=customer_email,
    )


async def get_claims(
    db: AsyncSession,
    customer_id: Optional[str] = None,
    policy_id: Optional[str] = None,
    requiring_attention: bool = False,
) -> List[AgentClaimWithCustomerResponse]:
    stmt = select(Claim).order_by(desc(Claim.submitted_at))

    if customer_id:
        stmt = stmt.where(Claim.customer_id == customer_id)
    if policy_id:
        stmt = stmt.where(Claim.policy_id == policy_id)
    if requiring_attention:
        stmt = stmt.where(
            Claim.status.in_(
                [
                    "SUBMITTED",
                    "DOCUMENT_VERIFICATION",
                    "POLICY_VALIDATION",
                    "UNDER_INVESTIGATION",
                    "FRAUD_ASSESSMENT",
                ]
            )
        )

    result = await db.execute(stmt)
    claims = result.scalars().all()

    enriched = []
    for c in claims:
        enriched.append(await enrich_claim_with_customer(db, c))
    return enriched


async def get_claim_by_id(db: AsyncSession, claim_id: str) -> ClaimResponse:
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalars().first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found"
        )
    return ClaimResponse.model_validate(claim)


async def get_claim_model_by_id(db: AsyncSession, claim_id: str) -> Optional[Claim]:
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    return result.scalars().first()


async def submit_claim(
    db: AsyncSession, customer_id: str, user_id: str, claim_in: ClaimCreate
) -> ClaimResponse:
    # Verify customer owns the policy and policy is active
    pol_res = await db.execute(
        select(Policy).where(
            Policy.id == claim_in.policy_id,
            Policy.customer_id == customer_id,
            Policy.status == "active",
        )
    )
    policy = pol_res.scalars().first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specified policy is invalid, inactive, or does not belong to the policyholder.",
        )

    count_res = await db.execute(select(func.count(Claim.id)))
    total_count = count_res.scalar_one()

    claim_id = f"clm_{uuid.uuid4().hex[:8]}"
    claim_number = f"CLM-{datetime.now().year}-{str(total_count + 101).zfill(3)}"
    now = datetime.now(timezone.utc)

    new_claim = Claim(
        id=claim_id,
        claim_number=claim_number,
        customer_id=customer_id,
        policy_id=claim_in.policy_id,
        status="SUBMITTED",
        incident_date=claim_in.incident_date,
        submitted_at=now,
        description=claim_in.description,
        claim_amount=claim_in.claim_amount,
        updated_at=now,
    )
    db.add(new_claim)

    # Initial history log entry
    history_entry = ClaimStatusHistory(
        id=f"hist_{uuid.uuid4().hex[:8]}",
        claim_id=claim_id,
        status="SUBMITTED",
        changed_at=now,
        changed_by=user_id,
        notes="Initial claim submission by policyholder.",
    )
    db.add(history_entry)

    await db.commit()
    await db.refresh(new_claim)
    return ClaimResponse.model_validate(new_claim)


async def update_claim_status(
    db: AsyncSession, claim_id: str, status_name: str, notes: Optional[str], user_id: str
) -> ClaimResponse:
    if status_name not in VALID_CLAIM_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid claim status: {status_name}",
        )

    claim = await get_claim_model_by_id(db, claim_id)
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found"
        )

    now = datetime.now(timezone.utc)
    claim.status = status_name
    claim.updated_at = now

    history_entry = ClaimStatusHistory(
        id=f"hist_{uuid.uuid4().hex[:8]}",
        claim_id=claim_id,
        status=status_name,
        changed_at=now,
        changed_by=user_id,
        notes=notes or f"Status updated to {status_name}.",
    )
    db.add(history_entry)

    await db.commit()
    await db.refresh(claim)
    return ClaimResponse.model_validate(claim)


async def get_claim_history(
    db: AsyncSession, claim_id: str
) -> List[ClaimStatusHistoryResponse]:
    result = await db.execute(
        select(ClaimStatusHistory)
        .where(ClaimStatusHistory.claim_id == claim_id)
        .order_by(asc(ClaimStatusHistory.changed_at))
    )
    entries = result.scalars().all()
    return [ClaimStatusHistoryResponse.model_validate(e) for e in entries]


async def get_claim_documents(
    db: AsyncSession, claim_id: str
) -> List[ClaimDocumentResponse]:
    result = await db.execute(
        select(ClaimDocument).where(ClaimDocument.claim_id == claim_id)
    )
    docs = result.scalars().all()
    return [ClaimDocumentResponse.model_validate(d) for d in docs]


async def get_agent_claim_summary(db: AsyncSession) -> AgentClaimSummaryResponse:
    result = await db.execute(select(Claim))
    claims = result.scalars().all()

    total_claims = len(claims)
    pending_review = len(
        [c for c in claims if c.status in ["SUBMITTED", "DOCUMENT_VERIFICATION", "POLICY_VALIDATION"]]
    )
    under_investigation = len([c for c in claims if c.status == "UNDER_INVESTIGATION"])
    fraud_alerts = len([c for c in claims if c.status == "FRAUD_ASSESSMENT"])

    return AgentClaimSummaryResponse(
        total_claims=total_claims,
        pending_review=pending_review,
        under_investigation=under_investigation,
        fraud_alerts=fraud_alerts,
    )
