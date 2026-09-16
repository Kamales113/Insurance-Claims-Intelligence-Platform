from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
    )


class ClaimCreate(BaseSchema):
    policy_id: str
    incident_date: date
    description: str = Field(..., min_length=20)
    claim_amount: float = Field(..., gt=0)


class ClaimStatusUpdate(BaseSchema):
    status: str
    notes: Optional[str] = None


class ClaimResponse(BaseSchema):
    id: str
    claim_number: str
    customer_id: str
    policy_id: str
    status: str
    incident_date: date
    submitted_at: datetime
    description: str
    claim_amount: float
    assigned_agent_id: Optional[str] = None
    updated_at: datetime


class ClaimWithPolicyResponse(ClaimResponse):
    policy_type: Optional[str] = "General Policy"
    policy_number: Optional[str] = "N/A"


class AgentClaimWithCustomerResponse(ClaimWithPolicyResponse):
    customer_name: str
    customer_email: str

