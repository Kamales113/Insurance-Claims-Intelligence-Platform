from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic.alias_generators import to_camel
from app.schemas.user import UserResponse


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
    )


class LoginRequest(BaseSchema):
    email: EmailStr
    password: str


class AuthResponse(BaseSchema):
    user: UserResponse
    token: str
