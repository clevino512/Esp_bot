from pydantic import BaseModel, Field, ConfigDict


class SettingsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    top_k: int = Field(ge=1, le=20)
    min_score: float = Field(ge=0, le=1)
    fallback_threshold: float = Field(ge=0, le=1)
    chunk_size: int = Field(ge=100, le=2000)
    chunk_overlap: int = Field(ge=0, le=200)
    llm_provider: str
    llm_model: str
    max_tokens: int = Field(ge=100, le=4000)
    temperature: float = Field(ge=0, le=2)
    notify_fallback: bool
    notify_weekly_report: bool