from typing import Any
import logging
import os
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.config.constants import DocumentCategory, MAX_FILE_SIZE_BYTES, ALLOWED_DOCUMENT_EXTENSIONS
from app.repositories.document_repository import DocumentRepository
from app.knowledge.loader import DocumentLoader
from app.knowledge.indexer import KnowledgeIndexer
from app.models.document import DocumentCreate, DocumentUpdate, DocumentResponse

logger = logging.getLogger(__name__)
settings = get_settings()


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.doc_repo = DocumentRepository(db)
        self.loader = DocumentLoader()
        self.indexer = KnowledgeIndexer()

    async def create_document(
        self,
        title: str,
        category: DocumentCategory = DocumentCategory.GENERAL,
        content: str | None = None,
        file_path: str | None = None,
        user_id: int | None = None,
    ) -> DocumentResponse:
        document = await self.doc_repo.create(
            title=title,
            category=category,
            file_path=file_path,
            uploaded_by_id=user_id,
            content_raw=content,
        )

        if content:
            chunk_count = await self.indexer.index_document(
                document_id=document.id,
                title=title,
                content=content,
                category=category,
            )
            document = await self.doc_repo.update(document, chunk_count=chunk_count)

        return DocumentResponse.model_validate(document)

    async def upload_document(
        self,
        file_data: bytes,
        filename: str,
        title: str | None = None,
        category: DocumentCategory = DocumentCategory.GENERAL,
        user_id: int | None = None,
    ) -> DocumentResponse:
        if len(file_data) > MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File size exceeds maximum: {MAX_FILE_SIZE_BYTES} bytes")

        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise ValueError(f"Unsupported file type: {ext}")

        upload_dir = Path(settings.HUGGINGFACE_CACHE_DIR).parent / "documents"
        upload_dir.mkdir(parents=True, exist_ok=True)

        file_path = upload_dir / f"{filename}"
        with open(file_path, "wb") as f:
            f.write(file_data)

        doc_data = self.loader.load(str(file_path))

        document = await self.doc_repo.create(
            title=title or filename,
            category=category,
            filename=filename,
            file_path=str(file_path),
            file_size=len(file_data),
            mime_type=self._get_mime_type(ext),
            content_raw=doc_data.get("content"),
            uploaded_by_id=user_id,
        )

        chunk_count = await self.indexer.index_document(
            document_id=document.id,
            title=document.title,
            content=doc_data.get("content", ""),
            category=category,
            filename=filename,
        )
        document = await self.doc_repo.update(document, chunk_count=chunk_count)

        return DocumentResponse.model_validate(document)

    def _get_mime_type(self, ext: str) -> str:
        mime_types = {
            ".pdf": "application/pdf",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".txt": "text/plain",
            ".md": "text/markdown",
            ".html": "text/html",
        }
        return mime_types.get(ext, "application/octet-stream")

    async def get_document(self, document_id: int) -> DocumentResponse | None:
        document = await self.doc_repo.get_by_id(document_id)
        if not document:
            return None
        return DocumentResponse.model_validate(document)

    async def update_document(
        self,
        document_id: int,
        update_data: DocumentUpdate,
    ) -> DocumentResponse | None:
        document = await self.doc_repo.get_by_id(document_id)
        if not document:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        document = await self.doc_repo.update(document, **update_dict)

        return DocumentResponse.model_validate(document)

    async def delete_document(self, document_id: int) -> bool:
        document = await self.doc_repo.get_by_id(document_id)
        if not document:
            return False

        self.indexer.remove_document(document_id)

        if document.file_path and os.path.exists(document.file_path):
            os.unlink(document.file_path)

        await self.doc_repo.delete(document)
        return True

    async def list_documents(
        self,
        category: DocumentCategory | None = None,
        is_active: bool | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[DocumentResponse], int]:
        offset = (page - 1) * page_size
        documents = await self.doc_repo.list_all(
            category=category,
            is_active=is_active,
            limit=page_size,
            offset=offset,
        )
        total = await self.doc_repo.count(category=category, is_active=is_active)

        return [DocumentResponse.model_validate(d) for d in documents], total

    async def reindex_document(self, document_id: int) -> int:
        document = await self.doc_repo.get_by_id(document_id)
        if not document:
            raise ValueError("Document not found")

        content = document.content_raw or ""
        if document.file_path and os.path.exists(document.file_path):
            doc_data = self.loader.load(document.file_path)
            content = doc_data.get("content", "")

        chunk_count = await self.indexer.reindex_document(
            document_id=document.id,
            title=document.title,
            content=content,
            category=document.category,
        )

        await self.doc_repo.update(document, chunk_count=chunk_count)
        return chunk_count

    async def get_stats(self) -> dict[str, Any]:
        total_docs = await self.doc_repo.count()
        active_docs = await self.doc_repo.count(is_active=True)
        total_chunks = await self.doc_repo.get_total_chunks()

        return {
            "total_documents": total_docs,
            "active_documents": active_docs,
            "total_chunks": total_chunks,
        }
