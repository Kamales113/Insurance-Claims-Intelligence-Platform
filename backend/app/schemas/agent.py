from datetime import datetime
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
    )


class AgentResponse(BaseSchema):
    id: str
    user_id: str
    department: str
    employee_id: str
    created_at: datetime


class AgentClaimSummaryResponse(BaseSchema):
    total_claims: int
    pending_review: int
    under_investigation: int
    fraud_alerts: int
