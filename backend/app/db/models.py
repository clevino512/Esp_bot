# app/db/models.py

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.config.constants import UserRole, DocumentCategory, FeedbackType, ConversationStatus


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name     = Column(String(100), nullable=False)

    # ✅ String(20) — cohérent avec la migration 001 (VARCHAR)
    role          = Column(String(20), default=UserRole.USER.value, nullable=False)

    is_active     = Column(Boolean, default=True, nullable=False)
    created_at    = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversations = relationship("Conversation", back_populates="user", lazy="dynamic")
    documents     = relationship("Document", back_populates="uploaded_by", lazy="dynamic")


class Document(Base):
    __tablename__ = "documents"

    id             = Column(Integer, primary_key=True, index=True)
    title          = Column(String(200), nullable=False)
    filename       = Column(String(255), nullable=True)
    file_path      = Column(String(500), nullable=True)
    file_size      = Column(Integer, nullable=True)
    mime_type      = Column(String(100), nullable=True)

    # ✅ Même correction pour DocumentCategory
    category       = Column(String(50), default=DocumentCategory.GENERAL.value, nullable=False)

    content_raw    = Column(Text, nullable=True)
    chunk_count    = Column(Integer, default=0, nullable=False)
    is_active      = Column(Boolean, default=True, nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    uploaded_by = relationship("User", back_populates="documents")
    chunks      = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_documents_category_active", "category", "is_active"),
    )


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id             = Column(Integer, primary_key=True, index=True)
    document_id    = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index    = Column(Integer, nullable=False)
    content        = Column(Text, nullable=False)
    embedding_id   = Column(String(100), nullable=True)
    chunk_metadata = Column(String(500), nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="chunks")

    __table_args__ = (
        Index("ix_chunks_document_idx", "document_id", "chunk_index"),
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, nullable=False, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # ✅ Même correction pour ConversationStatus
    status     = Column(String(20), default=ConversationStatus.ACTIVE.value, nullable=False)

    user_agent = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ended_at   = Column(DateTime, nullable=True)

    user     = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id              = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role            = Column(String(20), nullable=False)
    content         = Column(Text, nullable=False)
    sources         = Column(Text, nullable=True)
    confidence      = Column(Float, nullable=True)
    is_fallback     = Column(Boolean, default=False, nullable=False)

    # ✅ Même correction pour FeedbackType
    feedback        = Column(String(20), nullable=True)

    response_time_ms = Column(Integer, nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")

    __table_args__ = (
        Index("ix_messages_conversation_created", "conversation_id", "created_at"),
    )


class FeedbackLog(Base):
    __tablename__ = "feedback_logs"

    id            = Column(Integer, primary_key=True, index=True)
    message_id    = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    feedback_type = Column(String(20), nullable=False)
    user_query  = Column(Text, nullable=True)
    bot_response = Column(Text, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_feedback_created", "created_at"),
    )

class Setting(Base):
    __tablename__ = "settings"  

    id              = Column(Integer, primary_key=True, index=True)

    # --- RAG ---
    top_k           = Column(Integer, nullable=False, default=5)
    min_score       = Column(Float, nullable=False, default=0.65)
    fallback_threshold = Column(Float, nullable=False, default=0.40)
    chunk_size      = Column(Integer, nullable=False, default=500)
    chunk_overlap   = Column(Integer, nullable=False, default=50)

    # --- LLM ---
    llm_provider    = Column(String(50), nullable=False, default="openai")
    llm_model       = Column(String(50), nullable=False, default="gpt-4o-mini")
    max_tokens      = Column(Integer, nullable=False, default=1000)
    temperature     = Column(Float, nullable=False, default=0.2)

    # --- Notifications ---
    notify_fallback       = Column(Boolean, nullable=False, default=True)
    notify_weekly_report  = Column(Boolean, nullable=False, default=True)

    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
