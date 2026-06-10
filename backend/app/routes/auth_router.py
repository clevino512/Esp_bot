from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import DatabaseDep, CurrentUserDep
from app.services.auth_service import AuthService
from app.models.user import UserCreate, UserLogin, UserResponse, Token
from app.models.base import BaseResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=BaseResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: DatabaseDep,
):
    auth_service = AuthService(db)
    try:
        user = await auth_service.register(user_data)
        return BaseResponse(
            success=True,
            message="User registered successfully",
            data={"user": user.model_dump()},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: DatabaseDep,
):
    auth_service = AuthService(db)
    try:
        token = await auth_service.login(credentials.email, credentials.password)
        return token
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: DatabaseDep,
):
    auth_service = AuthService(db)
    token = await auth_service.refresh_tokens(refresh_token)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    return token


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: CurrentUserDep,
):
    return current_user


@router.post("/logout", response_model=BaseResponse)
async def logout(
    current_user: CurrentUserDep,
):
    return BaseResponse(
        success=True,
        message="Logged out successfully",
    )
