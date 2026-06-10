from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field

from app.config.constants import FeedbackType, MAX_MESSAGE_LENGTH


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
    created_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    session_id: str | None = None
    history: list[dict[str, Any]] | None = None


class ChatResponse(BaseModel):
    id: str
    response: str
    sources: list[Source]
    session_id: str
    confidence: float = Field(ge=0, le=1)
    is_fallback: bool = False
    created_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class FeedbackRequest(BaseModel):
    message_id: str
    feedback: FeedbackType


class ConversationHistory(BaseModel):
    session_id: str
    messages: list[Message]
    created_at: datetime
    updated_at: datetime
