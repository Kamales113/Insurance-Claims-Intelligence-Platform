from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from app.schemas.user import UserResponse


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
    )


class CustomerResponse(BaseSchema):
    id: str
    user_id: str
    phone: str
    address: str
    date_of_birth: date
    created_at: datetime


class CustomerWithProfileResponse(CustomerResponse):
    user: UserResponse
    policy_count: int
    claim_count: int


class CustomerClaimSummaryResponse(BaseSchema):
    total_claims: int
    active_claims: int
    approved_claims: int
    pending_claims: int
