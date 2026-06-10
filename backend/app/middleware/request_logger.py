import time
import logging
from typing import Any
import json

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import structlog

from app.config import get_settings

settings = get_settings()

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer() if settings.LOG_FORMAT == "json"
        else structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        request_id = request.headers.get("X-Request-ID", "-")
        client_ip = self._get_client_ip(request)

        log_context = {
            "method": request.method,
            "path": request.url.path,
            "query": str(request.query_params),
            "client_ip": client_ip,
            "user_agent": request.headers.get("User-Agent", "-"),
            "request_id": request_id,
        }

        logger.info("request_started", **log_context)

        try:
            response: Response = await call_next(request)
            process_time = (time.time() - start_time) * 1000

            log_context.update({
                "status_code": response.status_code,
                "process_time_ms": round(process_time, 2),
            })

            if response.status_code >= 400:
                logger.warning("request_failed", **log_context)
            else:
                logger.info("request_completed", **log_context)

            response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as exc:
            process_time = (time.time() - start_time) * 1000
            log_context.update({
                "status_code": 500,
                "process_time_ms": round(process_time, 2),
                "error": str(exc),
            })
            logger.error("request_error", **log_context)
            raise

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
