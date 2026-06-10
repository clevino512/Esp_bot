from typing import Any
import json
import logging

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import get_settings
from app.core.embedder import Embedder

logger = logging.getLogger(__name__)
settings = get_settings()


class Retriever:
    def __init__(
        self,
        collection_name: str | None = None,
        top_k: int | None = None,
        min_relevance: float | None = None,
    ):
        self.collection_name = collection_name or settings.CHROMA_COLLECTION_NAME
        self.top_k = top_k or settings.TOP_K_RETRIEVAL
        self.min_relevance = min_relevance or settings.MIN_RELEVANCE_SCORE
        self._client: chromadb.Client | None = None
        self._collection = None
        self._embedder: Embedder | None = None

    @property
    def embedder(self) -> Embedder:
        if self._embedder is None:
            self._embedder = Embedder()
        return self._embedder

    @property
    def client(self) -> chromadb.Client:
        if self._client is None:
            logger.info(f"Connecting to ChromaDB at {settings.CHROMA_HOST}:{settings.CHROMA_PORT}")
            self._client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT,
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                ),
            )
        return self._client

    @property
    def collection(self):
        if self._collection is None:
            self._collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": settings.CHROMA_DISTANCE_FUNCTION},
            )
        return self._collection

    def retrieve(self, query: str) -> list[dict[str, Any]]:
        query_embedding = self.embedder.embed_single(query)
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=self.top_k,
            include=["documents", "metadatas", "distances"],
        )

        retrieved = []
        if not results.get("ids"):
            return retrieved

        for i, doc_id in enumerate(results["ids"][0]):
            distance = results["distances"][0][i] if results.get("distances") else 0
            relevance = 1 - distance

            if relevance < self.min_relevance:
                continue

            metadata = results["metadatas"][0][i] if results.get("metadatas") else {}
            content = results["documents"][0][i] if results.get("documents") else ""

            retrieved.append({
                "id": doc_id,
                "content": content,
                "relevance_score": relevance,
                "metadata": metadata,
            })

        return retrieved

    async def aretrieve(self, query: str) -> list[dict[str, Any]]:
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.retrieve, query)

    def add_documents(
        self,
        ids: list[str],
        documents: list[str],
        metadatas: list[dict[str, Any]] | None = None,
    ) -> None:
        embeddings = self.embedder.embed(documents)
        self.collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        logger.info(f"Added {len(ids)} documents to collection")

    def delete_documents(self, ids: list[str]) -> None:
        self.collection.delete(ids=ids)
        logger.info(f"Deleted {len(ids)} documents from collection")

    def delete_by_document_id(self, document_id: int) -> None:
        prefix = f"doc_{document_id}_"
        all_ids = self.collection.get()["ids"]
        to_delete = [id_ for id_ in all_ids if id_.startswith(prefix)]
        if to_delete:
            self.delete_documents(to_delete)
            logger.info(f"Deleted {len(to_delete)} chunks for document {document_id}")

    def count(self) -> int:
        return self.collection.count()

    def reset(self) -> None:
        self.client.delete_collection(self.collection_name)
        self._collection = None
        logger.warning(f"Reset collection: {self.collection_name}")
