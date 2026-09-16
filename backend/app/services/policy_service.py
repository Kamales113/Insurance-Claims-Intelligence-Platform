from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.policy import Policy
from app.models.customer import Customer
from app.models.user import User
from app.models.claim import Claim
from app.schemas.policy import PolicyWithCustomerResponse


async def get_policies(
    db: AsyncSession, customer_id: Optional[str] = None
) -> List[PolicyWithCustomerResponse]:
    stmt = select(Policy).options(
        selectinload(Policy.customer).selectinload(Customer.user)
    )
    if customer_id:
        stmt = stmt.where(Policy.customer_id == customer_id)

    result = await db.execute(stmt)
    policies = result.scalars().all()

    response_list = []
    for p in policies:
        user = p.customer.user if p.customer else None
        customer_name = f"{user.first_name} {user.last_name}" if user else "Unknown customer"

        clm_count_res = await db.execute(
            select(func.count(Claim.id)).where(Claim.policy_id == p.id)
        )
        related_claim_count = clm_count_res.scalar_one()

        response_list.append(
            PolicyWithCustomerResponse(
                id=p.id,
                policy_number=p.policy_number,
                customer_id=p.customer_id,
                type=p.type,
                status=p.status,
                start_date=p.start_date,
                end_date=p.end_date,
                coverage_amount=p.coverage_amount,
                premium=p.premium,
                created_at=p.created_at,
                customer_name=customer_name,
                related_claim_count=related_claim_count,
            )
        )
    return response_list


async def get_policy_by_id(
    db: AsyncSession, policy_id: str
) -> PolicyWithCustomerResponse:
    stmt = select(Policy).options(
        selectinload(Policy.customer).selectinload(Customer.user)
    ).where(Policy.id == policy_id)
    result = await db.execute(stmt)
    p = result.scalars().first()

    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found"
        )

    user = p.customer.user if p.customer else None
    customer_name = f"{user.first_name} {user.last_name}" if user else "Unknown customer"

    clm_count_res = await db.execute(
        select(func.count(Claim.id)).where(Claim.policy_id == p.id)
    )
    related_claim_count = clm_count_res.scalar_one()

    return PolicyWithCustomerResponse(
        id=p.id,
        policy_number=p.policy_number,
        customer_id=p.customer_id,
        type=p.type,
        status=p.status,
        start_date=p.start_date,
        end_date=p.end_date,
        coverage_amount=p.coverage_amount,
        premium=p.premium,
        created_at=p.created_at,
        customer_name=customer_name,
        related_claim_count=related_claim_count,
    )
