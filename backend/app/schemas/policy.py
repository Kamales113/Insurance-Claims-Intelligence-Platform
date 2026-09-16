from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
    )


class PolicyResponse(BaseSchema):
    id: str
    policy_number: str
    customer_id: str
    type: str
    status: str
    start_date: date
    end_date: date
    coverage_amount: float
    premium: float
    created_at: datetime


class PolicyWithCustomerResponse(PolicyResponse):
    customer_name: str
    related_claim_count: int

