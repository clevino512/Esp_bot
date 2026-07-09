import uuid
import json
import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.retriever import Retriever
from app.core.llm_client import LLMClient
from app.core.fallback import FallbackHandler
from app.config.constants import FeedbackType, MAX_MESSAGE_LENGTH
from app.core.prompts import PromptTemplates
from app.repositories.conversation_repository import ConversationRepository
from app.models.chat import Source, ChatResponse, Message

logger = logging.getLogger(__name__)
settings = get_settings()

# Explicit markers that signal the current question is a follow-up on the previous one.
# We only expand the query when these patterns are present to avoid wrongly
# merging two unrelated questions.
_FOLLOWUP_STARTERS = (
    "et pour ", "mais pour ", "mais qu", "et qu",
    "qu'en est-il", "qu'en est",
    "comment ça ", "et ça ", "et ca ",
    "et lui ", "et elle ", "et eux ", "et elles ",
    "et ce ", "et cet ", "et cette ", "et ces ",
    "et le ", "et la ", "et les ",
)

# Pronouns / determiners that indicate reference to a previous subject
_FOLLOWUP_PRONOUNS = ("il ", "elle ", "ils ", "elles ", "ça ", "ca ", "ce ", "cela ", "celui ", "celle ")


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.conversation_repo = ConversationRepository(db)
        self.retriever = Retriever()
        self.llm = LLMClient()
        self.fallback = FallbackHandler()

    # ── Public API ────────────────────────────────────────────────────────────────

    async def process_message(
        self,
        user_message: str,
        session_id: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> ChatResponse:
        if not session_id:
            session_id = str(uuid.uuid4())

        conversation = await self.conversation_repo.get_by_session_id(session_id)
        if not conversation:
            conversation = await self.conversation_repo.create(session_id=session_id)

        await self.conversation_repo.add_message(
            conversation_id=conversation.id,
            role="user",
            content=user_message,
        )

        # ── 1. Contextual query expansion ────────────────────────────────────────
        # If the message looks like a follow-up ("et pour les bourses ?"), expand
        # it with context from history so retrieval is more accurate.
        retrieval_query = self._build_contextual_query(user_message, history or [])

        # ── 2. Retrieve relevant chunks ──────────────────────────────────────────
        sources = await self.retriever.aretrieve(retrieval_query)

        logger.info(f"Retrieved {len(sources)} sources for query: {retrieval_query!r}")
        for i, src in enumerate(sources):
            logger.debug(
                f"  Source {i+1}: title={src.get('metadata', {}).get('title')}, "
                f"relevance={src.get('relevance_score', 0):.3f}"
            )

        # ── 3. Decide fallback vs. RAG ────────────────────────────────────────────
        is_fallback = self.fallback.should_fallback(sources)

        if is_fallback:
            logger.warning(f"Fallback activated. Partial sources: {len(sources)}")
            context_text = (
                self.fallback._format_partial_context(sources[:3])
                if sources
                else ""
            )
            rag_prompt = (
                f"{context_text}\n\nQuestion : {user_message}"
                if context_text
                else PromptTemplates.format_fallback_prompt(user_message)
            )
        else:
            context_str = "\n\n".join(s.get("content", "") for s in sources[:5])
            rag_prompt = PromptTemplates.format_rag_prompt(
                question=user_message,
                context=context_str,
                sources=sources,
            )

        # ── 4. Generate answer (with conversation history for multi-turn context) ─
        response_text, response_time = await self.llm.generate_with_history(
            system_prompt=PromptTemplates.SYSTEM_PROMPT,
            user_prompt=rag_prompt,
            history=history or [],
        )

        # ── 5. Persist assistant message ─────────────────────────────────────────
        confidence = max(s.get("relevance_score", 0) for s in sources) if sources else 0.0

        assistant_message = await self.conversation_repo.add_message(
            conversation_id=conversation.id,
            role="assistant",
            content=response_text,
            sources=json.dumps([self._format_source(s) for s in sources]),
            confidence=confidence,
            is_fallback=is_fallback,
            response_time_ms=response_time,
        )

        source_models = [
            Source(
                document_id=int(s.get("metadata", {}).get("document_id", 0)),
                document_title=s.get("metadata", {}).get("title", "Document"),
                chunk_index=s.get("metadata", {}).get("chunk_index", 0),
                content=s.get("content", "")[:500],
                relevance_score=s.get("relevance_score", 0.0),
            )
            for s in sources[:5]
        ]

        return ChatResponse(
            id=str(assistant_message.id),
            response=response_text,
            sources=source_models,
            session_id=session_id,
            confidence=confidence,
            is_fallback=is_fallback,
            created_at=assistant_message.created_at,
        )

    async def get_history(self, session_id: str) -> list[Message]:
        conversation = await self.conversation_repo.get_by_session_id(session_id)
        if not conversation:
            return []

        messages = await self.conversation_repo.get_messages(conversation.id)
        return [
            Message(
                id=str(m.id),
                role=m.role,
                content=m.content,
                sources=json.loads(m.sources) if m.sources else None,
                feedback=m.feedback,
                created_at=m.created_at,
            )
            for m in messages
        ]

    async def submit_feedback(
        self,
        message_id: str,
        feedback_type: str,
    ) -> bool:
        try:
            feedback_enum = FeedbackType(feedback_type.upper())
            result = await self.conversation_repo.set_feedback(int(message_id), feedback_enum)
            return result is not None
        except (ValueError, KeyError) as e:
            logger.error(f"Invalid feedback type '{feedback_type}': {e}")
            return False

    async def clear_conversation(self, session_id: str) -> bool:
        conversation = await self.conversation_repo.get_by_session_id(session_id)
        if not conversation:
            return False
        await self.conversation_repo.end_conversation(conversation.id)
        return True

    # ── Private helpers ───────────────────────────────────────────────────────────

    def _build_contextual_query(
        self,
        current_message: str,
        history: list[dict[str, str]],
    ) -> str:
        """
        Expand the retrieval query when the current message is clearly a follow-up.
        We only trigger on explicit follow-up markers (conjunctions + topic switch,
        or sentences starting with a pronoun that refers back to the previous subject).
        This avoids merging two unrelated questions.

        Example:
            prev:    "Quelles sont les dates d'inscription ?"
            current: "Et pour les réinscriptions ?"
            expanded: "Quelles sont les dates d'inscription ? Et pour les réinscriptions ?"
        """
        if not history:
            return current_message

        msg_lower = current_message.lower().strip()
        word_count = len(current_message.split())

        explicit_followup = any(msg_lower.startswith(s) for s in _FOLLOWUP_STARTERS)

        # Very short sentences (≤ 4 words) that start with a pronoun referencing a prior subject
        pronoun_followup = word_count <= 4 and any(msg_lower.startswith(p) for p in _FOLLOWUP_PRONOUNS)

        if explicit_followup or pronoun_followup:
            last_user = next(
                (m["content"] for m in reversed(history) if m.get("role") == "user"),
                None,
            )
            if last_user and last_user != current_message:
                combined = f"{last_user} {current_message}"
                logger.debug(f"Expanded query: {combined!r}")
                return combined

        return current_message

    def _format_source(self, source: dict[str, Any]) -> dict[str, Any]:
        return {
            "document_id": source.get("metadata", {}).get("document_id", 0),
            "title": source.get("metadata", {}).get("title", ""),
            "chunk_index": source.get("metadata", {}).get("chunk_index", 0),
            "content": source.get("content", "")[:500],
            "relevance_score": source.get("relevance_score", 0.0),
        }
