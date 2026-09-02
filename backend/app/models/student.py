from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class StudentAccessCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    student_identifier: str = Field(..., min_length=4, max_length=64)


class StudentAccessUpdate(BaseModel):
    is_active: bool


class StudentAccessResponse(BaseModel):
    id: int
    full_name: str
    masked_identifier: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StudentVerification(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    student_identifier: str = Field(..., min_length=4, max_length=64)

    @field_validator("full_name", "student_identifier")
    @classmethod
    def strip_values(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Ce champ est obligatoire")
        return value