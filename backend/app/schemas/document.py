from datetime import datetime
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
    )


class ClaimDocumentResponse(BaseSchema):
    id: str
    claim_id: str
    file_name: str
    file_type: str
    uploaded_at: datetime
    uploaded_by: str
