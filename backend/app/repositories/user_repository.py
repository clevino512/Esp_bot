from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.config.constants import UserRole


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        email: str,
        password_hash: str,
        full_name: str,
        role: UserRole = UserRole.USER,
    ) -> User:
        user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role=role,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def update(self, user: User, **kwargs: Any) -> User:
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def delete(self, user: User) -> None:
        await self.db.delete(user)

    async def list_all(
        self,
        limit: int = 50,
        offset: int = 0,
    ) -> list[User]:
        result = await self.db.execute(
            select(User).offset(offset).limit(limit).order_by(User.created_at.desc())
        )
        return list(result.scalars().all())

    async def count(self) -> int:
        result = await self.db.execute(select(User.id))
        return len(result.all())
