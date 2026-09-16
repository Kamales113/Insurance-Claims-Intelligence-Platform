from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.customer import Customer
from app.models.user import User
from app.models.policy import Policy
from app.models.claim import Claim
from app.schemas.customer import (
    CustomerResponse,
    CustomerWithProfileResponse,
    CustomerClaimSummaryResponse,
)
from app.schemas.user import UserResponse


async def get_customer_by_user_id(db: AsyncSession, user_id: str) -> Optional[Customer]:
    result = await db.execute(
        select(Customer).options(selectinload(Customer.user)).where(Customer.user_id == user_id)
    )
    return result.scalars().first()


async def get_customer_by_id(db: AsyncSession, customer_id: str) -> Optional[Customer]:
    result = await db.execute(
        select(Customer).options(selectinload(Customer.user)).where(Customer.id == customer_id)
    )
    return result.scalars().first()


async def get_all_customers_with_profiles(
    db: AsyncSession
) -> List[CustomerWithProfileResponse]:
    result = await db.execute(
        select(Customer).options(selectinload(Customer.user))
    )
    customers = result.scalars().all()

    profiles = []
    for c in customers:
        pol_count_res = await db.execute(
            select(func.count(Policy.id)).where(Policy.customer_id == c.id)
        )
        policy_count = pol_count_res.scalar_one()

        clm_count_res = await db.execute(
            select(func.count(Claim.id)).where(Claim.customer_id == c.id)
        )
        claim_count = clm_count_res.scalar_one()

        profiles.append(
            CustomerWithProfileResponse(
                id=c.id,
                user_id=c.user_id,
                phone=c.phone,
                address=c.address,
                date_of_birth=c.date_of_birth,
                created_at=c.created_at,
                user=UserResponse.model_validate(c.user),
                policy_count=policy_count,
                claim_count=claim_count,
            )
        )
    return profiles


async def get_customer_profile_by_id(
    db: AsyncSession, customer_id: str
) -> CustomerWithProfileResponse:
    customer = await get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Customer profile not found"
        )

    pol_count_res = await db.execute(
        select(func.count(Policy.id)).where(Policy.customer_id == customer.id)
    )
    policy_count = pol_count_res.scalar_one()

    clm_count_res = await db.execute(
        select(func.count(Claim.id)).where(Claim.customer_id == customer.id)
    )
    claim_count = clm_count_res.scalar_one()

    return CustomerWithProfileResponse(
        id=customer.id,
        user_id=customer.user_id,
        phone=customer.phone,
        address=customer.address,
        date_of_birth=customer.date_of_birth,
        created_at=customer.created_at,
        user=UserResponse.model_validate(customer.user),
        policy_count=policy_count,
        claim_count=claim_count,
    )


async def get_customer_claim_summary(
    db: AsyncSession, customer_id: str
) -> CustomerClaimSummaryResponse:
    result = await db.execute(select(Claim).where(Claim.customer_id == customer_id))
    claims = result.scalars().all()

    total_claims = len(claims)
    active_claims = len([c for c in claims if c.status not in ["PAID", "REJECTED"]])
    approved_claims = len([c for c in claims if c.status in ["APPROVAL", "PAID"]])
    pending_claims = len(
        [
            c
            for c in claims
            if c.status
            in [
                "SUBMITTED",
                "DOCUMENT_VERIFICATION",
                "POLICY_VALIDATION",
                "UNDER_INVESTIGATION",
                "FRAUD_ASSESSMENT",
                "PAYMENT_PENDING",
            ]
        ]
    )

    return CustomerClaimSummaryResponse(
        total_claims=total_claims,
        active_claims=active_claims,
        approved_claims=approved_claims,
        pending_claims=pending_claims,
    )
