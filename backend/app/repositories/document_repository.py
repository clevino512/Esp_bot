from typing import Any
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Document, DocumentChunk
from app.config.constants import DocumentCategory


class DocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        title: str,
        category: DocumentCategory = DocumentCategory.GENERAL,
        filename: str | None = None,
        file_path: str | None = None,
        file_size: int | None = None,
        mime_type: str | None = None,
        content_raw: str | None = None,
        uploaded_by_id: int | None = None,
    ) -> Document:
        document = Document(
            title=title,
            category=category,
            filename=filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            content_raw=content_raw,
            uploaded_by_id=uploaded_by_id,
        )
        self.db.add(document)
        await self.db.flush()
        await self.db.refresh(document)
        return document

    async def get_by_id(self, document_id: int) -> Document | None:
        result = await self.db.execute(
            select(Document).where(Document.id == document_id)
        )
        return result.scalar_one_or_none()

    async def update(self, document: Document, **kwargs: Any) -> Document:
        for key, value in kwargs.items():
            if hasattr(document, key):
                setattr(document, key, value)
        await self.db.flush()
        await self.db.refresh(document)
        return document

    async def delete(self, document: Document) -> None:
        await self.db.delete(document)

    async def list_all(
        self,
        category: DocumentCategory | None = None,
        is_active: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Document]:
        query = select(Document)
        filters = []
        if category is not None:
            filters.append(Document.category == category)
        if is_active is not None:
            filters.append(Document.is_active == is_active)
        if filters:
            query = query.where(and_(*filters))
        result = await self.db.execute(
            query.offset(offset).limit(limit).order_by(Document.created_at.desc())
        )
        return list(result.scalars().all())

    async def count(
        self,
        category: DocumentCategory | None = None,
        is_active: bool | None = None,
    ) -> int:
        query = select(func.count(Document.id))
        filters = []
        if category is not None:
            filters.append(Document.category == category)
        if is_active is not None:
            filters.append(Document.is_active == is_active)
        if filters:
            query = query.where(and_(*filters))
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def add_chunk(
        self,
        document_id: int,
        chunk_index: int,
        content: str,
        embedding_id: str | None = None,
        chunk_metadata: str | None = None,
    ) -> DocumentChunk:
        chunk = DocumentChunk(
            document_id=document_id,
            chunk_index=chunk_index,
            content=content,
            embedding_id=embedding_id,
            chunk_metadata=metadata,
        )
        self.db.add(chunk)
        await self.db.flush()
        await self.db.refresh(chunk)
        return chunk

    async def get_chunks(self, document_id: int) -> list[DocumentChunk]:
        result = await self.db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index.asc())
        )
        return list(result.scalars().all())

    async def delete_chunks(self, document_id: int) -> int:
        chunks = await self.get_chunks(document_id)
        count = len(chunks)
        for chunk in chunks:
            await self.db.delete(chunk)
        return count

    async def update_chunk_count(self, document_id: int) -> None:
        result = await self.db.execute(
            select(func.count(DocumentChunk.id)).where(
                DocumentChunk.document_id == document_id
            )
        )
        count = result.scalar() or 0
        document = await self.get_by_id(document_id)
        if document:
            document.chunk_count = count
            await self.db.flush()

    async def get_total_chunks(self) -> int:
        result = await self.db.execute(select(func.count(DocumentChunk.id)))
        return result.scalar() or 0
