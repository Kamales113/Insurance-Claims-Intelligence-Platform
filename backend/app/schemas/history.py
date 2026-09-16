from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
    )


class ClaimStatusHistoryResponse(BaseSchema):
    id: str
    claim_id: str
    status: str
    changed_at: datetime
    changed_by: str
    notes: Optional[str] = None
