from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, AuthResponse
from app.schemas.user import UserResponse
from app.services.auth_service import authenticate_user

router = APIRouter()


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user",
    description="Authenticate user by email and password, returning user info and JWT access token.",
)
async def login(
    login_data: LoginRequest, db: AsyncSession = Depends(get_db)
) -> AuthResponse:
    return await authenticate_user(db, email=login_data.email, password=login_data.password)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user",
    description="Retrieve user profile details for the currently authenticated bearer session.",
)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout current user",
    description="Log out the currently authenticated user.",
)
async def logout(current_user: User = Depends(get_current_user)) -> dict:
    return {"message": "Successfully logged out"}
