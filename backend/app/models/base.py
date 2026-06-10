from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class BaseResponse(BaseModel):
    success: bool = True
    message: str = "OK"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data: dict[str, Any] | None = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
