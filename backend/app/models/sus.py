from datetime import datetime
from pydantic import BaseModel, Field


class SUSFeedbackRequest(BaseModel):
    session_id: str
    responses: dict[str, float] = Field(..., description="Question id (str) to rating (1-5) mapping")
    score: float = Field(..., ge=0, le=100, description="Computed SUS score")


class SUSFeedbackRecord(BaseModel):
    id: str
    session_id: str
    score: float
    responses: dict[str, float]
    created_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class SUSDistributionBucket(BaseModel):
    label: str
    range: str
    min: int
    max: int
    count: int


class SUSRecentScore(BaseModel):
    score: float
    timestamp: str


class SUSStats(BaseModel):
    count: int
    avg_score: float
    min_score: float
    max_score: float
    distribution: list[SUSDistributionBucket]
    recent_scores: list[SUSRecentScore]
