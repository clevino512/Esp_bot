from typing import Any
import logging
import re
import unicodedata

from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.config import get_settings
from app.config.constants import DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP, MIN_CHUNK_SIZE

logger = logging.getLogger(__name__)
settings = get_settings()


class TextPreprocessor:
    def __init__(

        
        self,
        chunk_size: int | None = None,
        chunk_overlap: int | None = None,
    ):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=[
                "\n\n\n",
                "\n\n",
                "\n",
                ". ",   # Period + space to avoid splitting abbreviations (M., Dr., etc.)
                " ",
                "",
            ],
            length_function=len,
        )

    def clean(self, text: str) -> str:
        text = text.strip()

        # ✅ Guillemets doubles typographiques → standard
        text = re.sub(r'[\u201c\u201d\u201e]', '"', text)

        # ✅ Guillemets simples typographiques → apostrophe standard
        text = re.sub(r'[\u2018\u2019\u201a]', "'", text)

        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)

        text = unicodedata.normalize("NFC", text)

        text = re.sub(r'[^\S\n]+', ' ', text)

        return text.strip()

    def chunk(
        self,
        text: str,
        metadata: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        cleaned_text = self.clean(text)
        raw_chunks = self.splitter.split_text(cleaned_text)

        chunks = []
        for i, chunk_text in enumerate(raw_chunks):
            if len(chunk_text.strip()) < MIN_CHUNK_SIZE:
                continue

            chunk_metadata = {
                **(metadata or {}),
                "chunk_index": i,
                "chunk_size": len(chunk_text),
            }
            chunks.append({
                "id": f"{metadata.get('document_id', 'doc')}_{i}" if metadata else f"chunk_{i}",
                "content": chunk_text,
                "metadata": chunk_metadata,
            })

        logger.info(f"Created {len(chunks)} chunks from text")
        return chunks

    def chunk_document(
        self,
        document: dict[str, Any],
    ) -> list[dict[str, Any]]:
        text = document.get("content", "")
        metadata = document.get("metadata", {})
        return self.chunk(text, metadata)

    def extract_keywords(self, text: str, max_keywords: int = 10) -> list[str]:
        words = re.findall(r'\b[a-zA-Z\u00C0-\u00FF]{4,}\b', text.lower())
        word_freq: dict[str, int] = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1

        stop_words = {
            "cette", "cet", "cette", "ces", "dans", "pour", "que", "qui",
            "avec", "sont", "avoir", "etre", "être", "fait", "faire",
            "comme", "tout", "tous", "toute", "toutes", "leur", "leurs",
            "dont", "aussi", "bien", "plus", "moins", "tre", "tres",
            "this", "that", "these", "those", "with", "from", "have",
            "has", "been", "were", "they", "their", "them", "which",
        }

        filtered = {k: v for k, v in word_freq.items() if k not in stop_words}
        sorted_words = sorted(filtered.items(), key=lambda x: x[1], reverse=True)
        return [word for word, _ in sorted_words[:max_keywords]]

    def compute_hash(self, text: str) -> str:
        import hashlib
        return hashlib.sha256(text.encode()).hexdigest()[:16]