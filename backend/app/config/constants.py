from enum import Enum
from typing import Final

# ── Chunking Defaults ───────────────────────────────────────────────────────────

DEFAULT_CHUNK_SIZE: Final[int] = 500
DEFAULT_CHUNK_OVERLAP: Final[int] = 50
MIN_CHUNK_SIZE: Final[int] = 100
MAX_CHUNK_SIZE: Final[int] = 2000

# ── Retrieval Defaults ──────────────────────────────────────────────────────────

DEFAULT_TOP_K: Final[int] = 5
MIN_RELEVANCE_SCORE: Final[float] = 0.65
FALLBACK_THRESHOLD: Final[float] = 0.40

# ── Message Limits ──────────────────────────────────────────────────────────────

MAX_MESSAGE_LENGTH: Final[int] = 2000
MAX_HISTORY_TURNS: Final[int] = 20

# ── Audio Limits ────────────────────────────────────────────────────────────────

MAX_AUDIO_DURATION_SECONDS: Final[int] = 60
MAX_AUDIO_FILE_SIZE_BYTES: Final[int] = 10 * 1024 * 1024  # 10 MB
AUDIO_SAMPLE_RATE: Final[int] = 16000

# ── File Upload Limits ──────────────────────────────────────────────────────────

MAX_FILE_SIZE_BYTES: Final[int] = 50 * 1024 * 1024  # 50 MB
ALLOWED_DOCUMENT_EXTENSIONS: Final[set[str]] = {
    ".pdf", ".docx", ".txt", ".md", ".html"
}

# ── JWT ────────────────────────────────────────────────────────────────────────

ACCESS_TOKEN_EXPIRE_MINUTES: Final[int] = 60
REFRESH_TOKEN_EXPIRE_DAYS: Final[int] = 7

# ── Knowledge Base Categories ───────────────────────────────────────────────────


class DocumentCategory(str, Enum):
    ADMISSION = "admission"
    INSCRIPTION = "inscription"
    EXAMENS = "examens"
    NOTES = "notes"
    BOURSES = "boursers"
    STAGES = "stages"
    DIPLOMES = "diplomes"
    EMPLOI_DU_TEMPS = "emploi_du_temps"
    REGLEMENT = "reglement"
    GENERAL = "general"


CATEGORY_LABELS: dict[DocumentCategory, str] = {
    DocumentCategory.ADMISSION: "Admission",
    DocumentCategory.INSCRIPTION: "Inscription",
    DocumentCategory.EXAMENS: "Examens",
    DocumentCategory.NOTES: "Notes & Relevés",
    DocumentCategory.BOURSES: "Bourses",
    DocumentCategory.STAGES: "Stages",
    DocumentCategory.DIPLOMES: "Diplômes",
    DocumentCategory.EMPLOI_DU_TEMPS: "Emploi du temps",
    DocumentCategory.REGLEMENT: "Règlement intérieur",
    DocumentCategory.GENERAL: "Général",
}

# ── User Roles ──────────────────────────────────────────────────────────────────


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


# ── Feedback Types ──────────────────────────────────────────────────────────────


class FeedbackType(str, Enum):
    HELPFUL = "helpful"
    NOT_HELPFUL = "not_helpful"


# ── Conversation Status ─────────────────────────────────────────────────────────


class ConversationStatus(str, Enum):
    ACTIVE = "active"
    ENDED = "ended"


# ── HTTP Status Messages ───────────────────────────────────────────────────────

HTTP_ERRORS: dict[int, str] = {
    400: "Requête invalide",
    401: "Non authentifié",
    403: "Accès refusé",
    404: "Ressource non trouvée",
    422: "Données invalides",
    429: "Trop de requêtes",
    500: "Erreur interne du serveur",
    503: "Service temporairement indisponible",
}

# ── API Version ─────────────────────────────────────────────────────────────────

API_V1_PREFIX: Final[str] = "/api/v1"
