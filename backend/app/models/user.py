# app/models/user.py

from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.config.constants import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: Annotated[str, Field(min_length=2, max_length=100)]


class UserCreate(UserBase):
    password: Annotated[str, Field(min_length=8, max_length=128)]
    role: UserRole = UserRole.USER


class UserLogin(BaseModel):
    # ✅ Champs dédupliqués — garder uniquement la version typée
    email: EmailStr
    password: Annotated[str, Field(min_length=1)]


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}  # ✅ syntaxe Pydantic v2

    @field_validator("role", mode="before")
    @classmethod
    def normalize_role(cls, v):
        """
        Convertit la valeur brute de la DB (str 'admin'/'user')
        en instance UserRole, insensible à la casse.
        """
        if isinstance(v, UserRole):
            return v
        if isinstance(v, str):
            try:
                return UserRole(v.lower())
            except ValueError:
                raise ValueError(
                    f"Rôle invalide : '{v}'. Valeurs acceptées : "
                    f"{[r.value for r in UserRole]}"
                )
        raise ValueError(f"Type de rôle inattendu : {type(v)}")


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    sub: str       # user_id
    email: str
    role: str
    exp: datetime
    iat: datetime
    type: str = "access"  # ✅ champ manquant utilisé dans auth_service.py