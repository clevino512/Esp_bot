from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, EmailStr, Field

from app.config.constants import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: Annotated[str, Field(min_length=2, max_length=100)]


class UserCreate(UserBase):
    password: Annotated[str, Field(min_length=8, max_length=128)]
    role: UserRole = UserRole.USER


class UserLogin(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=1)]


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    sub: str  # user_id
    email: str
    role: str
    exp: datetime
    iat: datetime
