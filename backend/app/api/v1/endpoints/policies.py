from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.policy import PolicyWithCustomerResponse
from app.services.customer_service import get_customer_by_user_id
from app.services.policy_service import get_policies, get_policy_by_id

router = APIRouter()


@router.get(
    "",
    response_model=List[PolicyWithCustomerResponse],
    status_code=status.HTTP_200_OK,
    summary="List policies",
    description="Retrieve list of insurance policies, optionally filtered by customer ID.",
)
async def list_policies(
    customer_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[PolicyWithCustomerResponse]:
    target_customer_id = customer_id
    if current_user.role == "customer":
        customer = await get_customer_by_user_id(db, current_user.id)
        if not customer:
            return []
        target_customer_id = customer.id

    return await get_policies(db, customer_id=target_customer_id)


@router.get(
    "/{id}",
    response_model=PolicyWithCustomerResponse,
    status_code=status.HTTP_200_OK,
    summary="Get policy by ID",
    description="Retrieve details for a specific policy by ID.",
)
async def get_policy(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PolicyWithCustomerResponse:
    policy = await get_policy_by_id(db, id)
    if current_user.role == "customer":
        customer = await get_customer_by_user_id(db, current_user.id)
        if not customer or policy.customer_id != customer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to requested policy",
            )
    return policy
