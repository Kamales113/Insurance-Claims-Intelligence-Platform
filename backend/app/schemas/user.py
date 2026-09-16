from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic.alias_generators import to_camel


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
    )


class UserResponse(BaseSchema):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    created_at: datetime
