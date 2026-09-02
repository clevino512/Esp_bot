from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, Field

from app.config.constants import FeedbackType, MAX_MESSAGE_LENGTH
from app.models.student import StudentVerification


def serialize_utc_datetime(value: datetime) -> str:
    """Serialize legacy naive UTC datetimes with an explicit UTC suffix."""
    aware_value = (
        value.replace(tzinfo=timezone.utc)
        if value.tzinfo is None
        else value.astimezone(timezone.utc)
    )
    return aware_value.isoformat().replace("+00:00", "Z")


class Source(BaseModel):
    document_id: int
    document_title: str
    chunk_index: int
    content: str = Field(..., max_length=500)
    relevance_score: float = Field(ge=0, le=1)


class Message(BaseModel):
    id: str
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str
    sources: list[Source] | None = None
    feedback: FeedbackType | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: serialize_utc_datetime,
        }


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    session_id: str | None = None
    history: list[dict[str, Any]] | None = None
    student_verification: StudentVerification | None = None


class ChatResponse(BaseModel):
    id: str
    response: str
    sources: list[Source]
    session_id: str
    confidence: float = Field(ge=0, le=1)
    is_fallback: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: serialize_utc_datetime,
        }


class FeedbackRequest(BaseModel):
    message_id: str
    feedback: FeedbackType


class ConversationHistory(BaseModel):
    session_id: str
    messages: list[Message]
    created_at: datetime
    updated_at: datetime