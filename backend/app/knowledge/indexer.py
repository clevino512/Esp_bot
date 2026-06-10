from typing import Any
import logging
import json
import time

from app.config import get_settings
from app.config.constants import DocumentCategory
from app.core.embedder import Embedder
from app.core.retriever import Retriever
from app.knowledge.loader import DocumentLoader
from app.knowledge.preprocessor import TextPreprocessor

logger = logging.getLogger(__name__)
settings = get_settings()


class KnowledgeIndexer:
    def __init__(
        self,
        collection_name: str | None = None,
    ):
        self.loader = DocumentLoader()
        self.preprocessor = TextPreprocessor()
        self.embedder = Embedder()
        self.retriever = Retriever(collection_name=collection_name)

    async def index_document(
        self,
        document_id: int,
        title: str,
        content: str,
        category: DocumentCategory = DocumentCategory.GENERAL,
        filename: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> int:
        start_time = time.time()
        chunks = self.preprocessor.chunk(
            content,
            metadata={
                "document_id": document_id,
                "title": title,
                "category": category.value,
                "filename": filename,
                **(metadata or {}),
            }
        )

        if not chunks:
            logger.warning(f"No chunks created for document {document_id}")
            return 0

        chunk_ids = [f"doc_{document_id}_{i}" for i in range(len(chunks))]
        chunk_texts = [c["content"] for c in chunks]
        chunk_metadatas = [c["metadata"] for c in chunks]

        self.retriever.add_documents(
            ids=chunk_ids,
            documents=chunk_texts,
            metadatas=chunk_metadatas,
        )

        elapsed = time.time() - start_time
        logger.info(
            f"Indexed {len(chunks)} chunks for document {document_id} in {elapsed:.2f}s"
        )
        return len(chunks)

    async def index_file(
        self,
        document_id: int,
        file_path: str,
        title: str | None = None,
        category: DocumentCategory = DocumentCategory.GENERAL,
    ) -> int:
        document = self.loader.load(file_path)
        content = document["content"]
        metadata = document["metadata"]

        actual_title = title or metadata.get("filename", f"Document {document_id}")

        return await self.index_document(
            document_id=document_id,
            title=actual_title,
            content=content,
            category=category,
            filename=metadata.get("filename"),
            metadata=metadata,
        )

    def remove_document(self, document_id: int) -> None:
        self.retriever.delete_by_document_id(document_id)
        logger.info(f"Removed document {document_id} from index")

    async def reindex_document(
        self,
        document_id: int,
        content: str,
        title: str,
        category: DocumentCategory = DocumentCategory.GENERAL,
        **kwargs: Any,
    ) -> int:
        self.remove_document(document_id)
        return await self.index_document(
            document_id=document_id,
            title=title,
            content=content,
            category=category,
            **kwargs,
        )

    async def bulk_index(
        self,
        documents: list[dict[str, Any]],
    ) -> dict[int, int]:
        results: dict[int, int] = {}
        for doc in documents:
            doc_id = doc.get("id")
            if not doc_id:
                continue

            chunk_count = await self.index_document(
                document_id=doc_id,
                title=doc.get("title", f"Document {doc_id}"),
                content=doc.get("content", ""),
                category=doc.get("category", DocumentCategory.GENERAL),
                metadata=doc.get("metadata"),
            )
            results[doc_id] = chunk_count

        return results

    def get_stats(self) -> dict[str, Any]:
        total_chunks = self.retriever.count()
        return {
            "total_chunks": total_chunks,
        }

    def reset(self) -> None:
        self.retriever.reset()
        logger.warning("Knowledge base index has been reset")
