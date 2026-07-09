from datetime import datetime
from typing import Any
from pydantic import BaseModel

from app.config.constants import FeedbackType


class DashboardStats(BaseModel):
    total_conversations: int
    unique_users: int
    avg_response_time_ms: float
    avg_confidence_score: float
    fallback_rate: float
    helpful_rate: float
    active_documents: int
    total_chunks: int
    period_start: datetime
    period_end: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class ConversationLog(BaseModel):
    id: str
    session_id: str
    user_query: str
    bot_response: str
    sources: list[dict[str, Any]]
    confidence: float
    is_fallback: bool
    feedback: FeedbackType | None
    response_time_ms: float
    created_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class FallbackQuestion(BaseModel):
    question: str
    count: int
    last_seen: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
