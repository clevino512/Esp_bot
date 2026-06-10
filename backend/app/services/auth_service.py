import uuid
from datetime import datetime, timedelta
from typing import Any

from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.config.constants import UserRole, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from app.repositories.user_repository import UserRepository
from app.models.user import UserCreate, UserResponse, Token, TokenPayload

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def create_access_token(self, user_id: int, email: str, role: str) -> str:
        now = datetime.utcnow()
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": str(user_id),
            "email": email,
            "role": role,
            "exp": expire,
            "iat": now,
            "type": "access",
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def create_refresh_token(self, user_id: int, email: str) -> str:
        now = datetime.utcnow()
        expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        payload = {
            "sub": str(user_id),
            "email": email,
            "exp": expire,
            "iat": now,
            "type": "refresh",
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def decode_token(self, token: str) -> TokenPayload | None:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return TokenPayload(
                sub=payload["sub"],
                email=payload["email"],
                role=payload.get("role", "user"),
                exp=datetime.fromtimestamp(payload["exp"]),
                iat=datetime.fromtimestamp(payload["iat"]),
            )
        except JWTError:
            return None

    async def register(self, user_data: UserCreate) -> UserResponse:
        existing = await self.user_repo.get_by_email(user_data.email)
        if existing:
            raise ValueError("Email already registered")

        password_hash = self.hash_password(user_data.password)
        user = await self.user_repo.create(
            email=user_data.email,
            password_hash=password_hash,
            full_name=user_data.full_name,
            role=user_data.role,
        )

        return UserResponse.model_validate(user)

    async def login(self, email: str, password: str) -> Token:
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ValueError("Invalid credentials")

        if not self.verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")

        if not user.is_active:
            raise ValueError("Account is deactivated")

        access_token = self.create_access_token(user.id, user.email, user.role.value)
        refresh_token = self.create_refresh_token(user.id, user.email)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def get_current_user(self, token: str) -> UserResponse | None:
        payload = self.decode_token(token)
        if not payload:
            return None

        if payload.type == "refresh":
            return None

        user = await self.user_repo.get_by_id(int(payload.sub))
        if not user:
            return None

        return UserResponse.model_validate(user)

    async def refresh_tokens(self, refresh_token: str) -> Token | None:
        payload = self.decode_token(refresh_token)
        if not payload:
            return None

        user = await self.user_repo.get_by_id(int(payload.sub))
        if not user or not user.is_active:
            return None

        access_token = self.create_access_token(user.id, user.email, user.role.value)
        new_refresh_token = self.create_refresh_token(user.id, user.email)

        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def create_admin_user(self, email: str, password: str, full_name: str) -> UserResponse:
        return await self.register(UserCreate(
            email=email,
            password=password,
            full_name=full_name,
            role=UserRole.ADMIN,
        ))
