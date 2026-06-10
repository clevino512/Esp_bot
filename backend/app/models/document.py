from datetime import datetime
from pydantic import BaseModel, Field

from app.config.constants import DocumentCategory


class DocumentBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    category: DocumentCategory = DocumentCategory.GENERAL


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    title: str | None = Field(None, min_length=2, max_length=200)
    category: DocumentCategory | None = None
    is_active: bool | None = None


class DocumentResponse(BaseModel):
    id: int
    title: str
    filename: str | None
    category: DocumentCategory
    chunk_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DocumentIngestRequest(BaseModel):
    document_id: int
    force_reindex: bool = False
