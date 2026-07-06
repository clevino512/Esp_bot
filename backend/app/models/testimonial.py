from datetime import datetime
from pydantic import BaseModel, Field


class TestimonialCreate(BaseModel):
    text: str = Field(..., min_length=10, max_length=500)
    rating: int = Field(..., ge=1, le=5)
    session_id: str | None = None
    author_label: str | None = Field(None, max_length=50)  # e.g. "Étudiant L1 Informatique"


class TestimonialPublic(BaseModel):
    id: str
    text: str
    rating: int
    author_label: str | None
    created_at: str


class TestimonialAdmin(TestimonialPublic):
    session_id: str | None
    visible: bool
