from typing import Any
import logging
from sentence_transformers import SentenceTransformer

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class Embedder:
    def __init__(
        self,
        model_name: str | None = None,
        device: str | None = None,
    ):
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self.device = device or settings.EMBEDDING_DEVICE
        self._model: SentenceTransformer | None = None

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            logger.info(f"Loading embedding model: {self.model_name} on {self.device}")
            self._model = SentenceTransformer(
                self.model_name,
                cache_folder=settings.HUGGINGFACE_CACHE_DIR,
            )
            if self.device != "cpu":
                self._model = self._model.to(self.device)
        return self._model

    def embed(self, texts: list[str]) -> list[list[float]]:
        embeddings = self.model.encode(
            texts,
            convert_to_numpy=True,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        return embeddings.tolist()

    def embed_single(self, text: str) -> list[float]:
        return self.embed([text])[0]

    def embed_documents(self, documents: list[dict[str, Any]]) -> list[list[float]]:
        texts = [doc.get("content", "") for doc in documents]
        return self.embed(texts)

    @property
    def dimension(self) -> int:
        return len(self.embed_single("test"))

    async def aembed(self, texts: list[str]) -> list[list[float]]:
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.embed, texts)

    async def aembed_single(self, text: str) -> list[float]:
        result = await self.aembed([text])
        return result[0]
