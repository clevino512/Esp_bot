# app/middleware/auth.py

import logging
from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.db.session import get_db
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)

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
        
        logger.info(f"PATH REÇU  : '{request.url.path}'")
        logger.info(f"IS PUBLIC  : {self._is_public_path(request.url.path)}")


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

        token = auth_header.replace("Bearer ", "").strip()

        try:
            # ✅ Appel direct AuthService sans passer par Depends
            async for db in get_db():
                auth_service = AuthService(db)
                user = await auth_service.get_current_user(token)
                break

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

        return await call_next(request)

    def _is_public_path(self, path: str) -> bool:
        for public_path in PUBLIC_PATHS:
            if path.startswith(public_path):
                return True
        return path == "/" or path.startswith("/static")


    