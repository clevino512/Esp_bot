import time
from typing import Annotated
from collections import defaultdict

from fastapi import Request, HTTPException, status, Depends
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)


class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 30):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = self._get_client_ip(request)
        now = time.time()
        minute_ago = now - 60

        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if t > minute_ago
        ]

        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return self._rate_limit_response()

        self.requests[client_ip].append(now)

        response = await call_next(request)
        return response

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _rate_limit_response(self):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Too many requests",
                "retry_after": 60,
            },
            headers={"Retry-After": "60"},
        )


def rate_limit(
    requests_per_minute: int = 30,
):
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=[f"{requests_per_minute}/minute"],
    )
    return limiter
