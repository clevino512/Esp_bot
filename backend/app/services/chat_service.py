import uuid
import json
import logging
from typing import Any, AsyncGenerator

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


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.conversation_repo = ConversationRepository(db)
        self.retriever = Retriever()
        self.llm = LLMClient()
        self.fallback = FallbackHandler()

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

        sources = await self.retriever.aretrieve(user_message)
        
        # ✅ LOG DÉTAILLÉ pour déboguer l'indexation
        logger.info(f"Retrieved {len(sources)} sources for query: {user_message}")
        for i, source in enumerate(sources):
            logger.debug(f"  Source {i+1}: title={source.get('metadata', {}).get('title')}, "
                        f"relevance={source.get('relevance_score'):.3f}")
        
        is_fallback = self.fallback.should_fallback(sources)

        if is_fallback:
            # ✅ AMÉLIORÉ: Même avec pertinence partielle, utiliser le contexte disponible
            logger.warning(f"Fallback mode activated. Using {len(sources)} partial sources.")
            context = sources[:3] if sources else None
            context_text = self.fallback._format_partial_context(context or []) if context else ""
            response_text, response_time = await self.llm.generate_with_timing(
                system_prompt=PromptTemplates.SYSTEM_PROMPT,
                user_prompt=f"{context_text}\n\nQuestion: {user_message}" if context_text else f"Question: {user_message}",
            )
        else:
            context_str = "\n\n".join(s.get("content", "") for s in sources[:3])
            prompt = PromptTemplates.format_rag_prompt(
                question=user_message,
                context=context_str,
            )
            response_text, response_time = await self.llm.generate_with_timing(
                system_prompt=PromptTemplates.SYSTEM_PROMPT,
                user_prompt=prompt,
            )

        confidence = max(s.get("relevance_score", 0) for s in sources) if sources else 0.0

        await self.conversation_repo.add_message(
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
            id=str(uuid.uuid4()),
            response=response_text,
            sources=source_models,
            session_id=session_id,
            confidence=confidence,
            is_fallback=is_fallback,
        )

    def _format_source(self, source: dict[str, Any]) -> dict[str, Any]:
        return {
            "document_id": source.get("metadata", {}).get("document_id", 0),
            "title": source.get("metadata", {}).get("title", ""),
            "chunk_index": source.get("metadata", {}).get("chunk_index", 0),
            "content": source.get("content", "")[:500],
            "relevance_score": source.get("relevance_score", 0.0),
        }

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
            feedback_type: str
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
