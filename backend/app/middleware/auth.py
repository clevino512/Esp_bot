from typing import Any
import logging
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.services.auth_service import AuthService
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

PUBLIC_PATHS = [
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/health",
    "/docs",
    "/openapi.json",
    "/redoc",
]


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if self._is_public_path(request.url.path):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Missing authorization header"},
            )

        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid authorization header format"},
            )

        token = auth_header.replace("Bearer ", "")

        try:
            from app.dependencies import get_current_user_optional
            user = await get_current_user_optional(token)
            if not user:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid or expired token"},
                )
            request.state.user = user
        except Exception as e:
            logger.error(f"Auth middleware error: {e}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Authentication failed"},
            )

        response = await call_next(request)
        return response

    def _is_public_path(self, path: str) -> bool:
        for public_path in PUBLIC_PATHS:
            if path.startswith(public_path):
                return True
        return path == "/" or path.startswith("/static")


async def get_current_user(request: Request):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user


async def get_current_admin(request: Request):
    user = await get_current_user(request)
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
