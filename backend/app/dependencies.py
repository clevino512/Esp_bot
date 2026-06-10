from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.auth_service import AuthService
from app.config.constants import UserRole

security = HTTPBearer(auto_error=False)


async def get_db_session() -> AsyncSession:
    async for session in get_db():
        yield session


DatabaseDep = Annotated[AsyncSession, Depends(get_db_session)]


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: DatabaseDep = None,
):
    if not credentials:
        return None
    token = credentials.credentials
    auth_service = AuthService(db)
    return await auth_service.get_current_user(token)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: DatabaseDep = None,
):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_admin(
    user = Depends(get_current_user),
):
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


CurrentUserDep = Annotated[dict, Depends(get_current_user)]
CurrentAdminDep = Annotated[dict, Depends(get_current_admin)]
OptionalUserDep = Annotated[dict | None, Depends(get_current_user_optional)]
