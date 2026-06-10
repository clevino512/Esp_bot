from datetime import datetime
from pydantic import BaseModel


class VoiceUploadRequest(BaseModel):
    session_id: str | None = None
    language: str = "fr"


class VoiceTranscriptionResponse(BaseModel):
    id: str
    text: str
    language: str
    duration_seconds: float
    confidence: float
    created_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
