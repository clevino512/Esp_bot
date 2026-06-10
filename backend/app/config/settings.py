from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────
    APP_ENV: Literal["development", "production"] = "development"
    APP_NAME: str = "UniBot ESPA"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # ── LLM ──────────────────────────────────────────────────
    LLM_PROVIDER: Literal["openai", "ollama"] = "openai"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_MAX_TOKENS: int = 1000
    OPENAI_TEMPERATURE: float = 0.2
    OLLAMA_BASE_URL: str = "http://ollama:11434"
    OLLAMA_MODEL: str = "mistral:7b"

    # ── ChromaDB ─────────────────────────────────────────────
    CHROMA_HOST: str = "chromadb"
    CHROMA_PORT: int = 8000
    CHROMA_COLLECTION_NAME: str = "espa_knowledge_base"
    CHROMA_DISTANCE_FUNCTION: str = "cosine"

    # ── Embeddings ────────────────────────────────────────────
    EMBEDDING_MODEL: str = "paraphrase-multilingual-MiniLM-L12-v2"
    EMBEDDING_DEVICE: str = "cpu"
    HUGGINGFACE_CACHE_DIR: str = "/app/.cache/huggingface"

    # ── RAG ──────────────────────────────────────────────────
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    TOP_K_RETRIEVAL: int = 5
    MIN_RELEVANCE_SCORE: float = 0.65
    FALLBACK_THRESHOLD: float = 0.40

    # ── PostgreSQL ───────────────────────────────────────────
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "esp_bot"
    POSTGRES_USER: str = "root"
    POSTGRES_PASSWORD: str = ""
    DATABASE_URL: str = "postgresql+asyncpg://root:@postgres:5432/esp_bot"

    # ── Redis ────────────────────────────────────────────────
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_URL: str = "redis://:@redis:6379/0"
    SESSION_TTL_SECONDS: int = 3600
    CONVERSATION_HISTORY_MAX: int = 20

    # ── JWT Auth ─────────────────────────────────────────────
    SECRET_KEY: str = "changeme-generate-with-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── ASR ──────────────────────────────────────────────────
    ASR_MODE: Literal["whisper", "vosk"] = "whisper"
    WHISPER_MODEL: str = "base"
    WHISPER_LANGUAGE: str = "fr"
    WHISPER_DEVICE: str = "cpu"
    VOSK_MODEL_PATH: str = "/app/.cache/vosk/vosk-model-fr-0.22"
    VOSK_SAMPLE_RATE: int = 16000

    # ── TTS ──────────────────────────────────────────────────
    TTS_ENGINE: Literal["gtts", "coqui"] = "gtts"
    TTS_LANGUAGE: str = "fr"

    # ── Audio ────────────────────────────────────────────────
    AUDIO_SAMPLE_RATE: int = 16000
    AUDIO_MAX_DURATION_SECONDS: int = 60
    AUDIO_MAX_FILE_SIZE_MB: int = 10

    # ── CORS ─────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    RATE_LIMIT_PER_MINUTE: int = 30

    # ── Logging ──────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: Literal["json", "text"] = "json"
    LOG_FILE: str = "/app/logs/unibot.log"

    # ── Admin ────────────────────────────────────────────────
    ADMIN_EMAIL: str = "admin@espa.mg"
    ADMIN_DEFAULT_PASSWORD: str = "admin123"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
