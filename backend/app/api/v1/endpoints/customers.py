from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user, require_role
from app.models.user import User
from app.schemas.customer import (
    CustomerResponse,
    CustomerWithProfileResponse,
    CustomerClaimSummaryResponse,
)
from app.services.customer_service import (
    get_customer_by_user_id,
    get_customer_by_id,
    get_all_customers_with_profiles,
    get_customer_profile_by_id,
    get_customer_claim_summary,
)

router = APIRouter()


@router.get(
    "/me",
    response_model=CustomerResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current customer profile",
    description="Retrieve policyholder customer record linked to the authenticated user.",
)
async def get_current_customer_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["customer"])),
) -> CustomerResponse:
    customer = await get_customer_by_user_id(db, current_user.id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Customer profile not found"
        )
    return CustomerResponse.model_validate(customer)


@router.get(
    "",
    response_model=List[CustomerWithProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="List all customers",
    description="Retrieve all customer profiles with policy and claim counts (Agent/Admin only).",
)
async def list_customers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["agent", "admin"])),
) -> List[CustomerWithProfileResponse]:
    return await get_all_customers_with_profiles(db)


@router.get(
    "/{id}",
    response_model=CustomerWithProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get customer by ID",
    description="Retrieve a specific customer profile by ID.",
)
async def get_customer_by_id_endpoint(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CustomerWithProfileResponse:
    if current_user.role == "customer":
        customer = await get_customer_by_user_id(db, current_user.id)
        if not customer or customer.id != id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to requested customer profile",
            )
    return await get_customer_profile_by_id(db, id)


@router.get(
    "/{id}/summary",
    response_model=CustomerClaimSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get customer claim summary",
    description="Retrieve claim metric counters (total, active, approved, pending) for a customer.",
)
async def get_customer_summary(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CustomerClaimSummaryResponse:
    if current_user.role == "customer":
        customer = await get_customer_by_user_id(db, current_user.id)
        if not customer or customer.id != id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to requested customer summary",
            )
    return await get_customer_claim_summary(db, id)
