from datetime import datetime
from pydantic import BaseModel, Field


class VoiceUploadRequest(BaseModel):
    session_id: str | None = None
    language: str = "fr"


class VoiceTranscriptionResponse(BaseModel):
    id: str
    text: str
    language: str
    duration_seconds: float
    confidence: float
    processing_time_ms: float | None = None
    real_time_factor: float | None = None
    engine: str | None = None
    model: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
