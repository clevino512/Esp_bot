from datetime import datetime
from typing import Any
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Conversation, Message
from app.config.constants import ConversationStatus, FeedbackType


class ConversationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        session_id: str,
        user_id: int | None = None,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> Conversation:
        conversation = Conversation(
            session_id=session_id,
            user_id=user_id,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        self.db.add(conversation)
        await self.db.flush()
        await self.db.refresh(conversation)
        return conversation

    async def get_by_session_id(self, session_id: str) -> Conversation | None:
        result = await self.db.execute(
            select(Conversation).where(Conversation.session_id == session_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, conversation_id: int) -> Conversation | None:
        result = await self.db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def add_message(
        self,
        conversation_id: int,
        role: str,
        content: str,
        sources: str | None = None,
        confidence: float | None = None,
        is_fallback: bool = False,
        response_time_ms: int | None = None,
    ) -> Message:
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            sources=sources,
            confidence=confidence,
            is_fallback=is_fallback,
            response_time_ms=response_time_ms,
        )
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message

    async def set_feedback(
        self,
        message_id: int,
        feedback: FeedbackType,
    ) -> Message | None:
        result = await self.db.execute(
            select(Message).where(Message.id == message_id)
        )
        message = result.scalar_one_or_none()
        if message:
            message.feedback = feedback
            await self.db.flush()
            await self.db.refresh(message)
        return message

    async def end_conversation(self, conversation_id: int) -> Conversation | None:
        result = await self.db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()
        if conversation:
            conversation.status = ConversationStatus.ENDED
            conversation.ended_at = datetime.utcnow()
            await self.db.flush()
            await self.db.refresh(conversation)
        return conversation

    async def get_messages(
        self,
        conversation_id: int,
        limit: int = 50,
    ) -> list[Message]:
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_stats(
        self,
        start_date: datetime,
        end_date: datetime,
    ) -> dict[str, Any]:
        total_result = await self.db.execute(
            select(func.count(Conversation.id)).where(
                and_(
                    Conversation.created_at >= start_date,
                    Conversation.created_at <= end_date,
                )
            )
        )
        total_conversations = total_result.scalar() or 0

        fallback_result = await self.db.execute(
            select(func.count(Message.id)).where(
                and_(
                    Message.is_fallback == True,
                    Message.created_at >= start_date,
                    Message.created_at <= end_date,
                )
            )
        )
        fallback_count = fallback_result.scalar() or 0

        helpful_result = await self.db.execute(
            select(func.count(Message.id)).where(
                and_(
                    Message.feedback == FeedbackType.HELPFUL,
                    Message.created_at >= start_date,
                    Message.created_at <= end_date,
                )
            )
        )
        helpful_count = helpful_result.scalar() or 0

        total_messages_result = await self.db.execute(
            select(func.count(Message.id)).where(
                and_(
                    Message.role == "assistant",
                    Message.created_at >= start_date,
                    Message.created_at <= end_date,
                )
            )
        )
        total_messages = total_messages_result.scalar() or 0

        avg_confidence_result = await self.db.execute(
            select(func.avg(Message.confidence)).where(
                and_(
                    Message.role == "assistant",
                    Message.created_at >= start_date,
                    Message.created_at <= end_date,
                )
            )
        )
        avg_confidence = avg_confidence_result.scalar() or 0.0

        avg_time_result = await self.db.execute(
            select(func.avg(Message.response_time_ms)).where(
                and_(
                    Message.role == "assistant",
                    Message.response_time_ms != None,
                    Message.created_at >= start_date,
                    Message.created_at <= end_date,
                )
            )
        )
        avg_response_time = avg_time_result.scalar() or 0.0

        unique_users_result = await self.db.execute(
            select(func.count(func.distinct(Conversation.user_id))).where(
                and_(
                    Conversation.created_at >= start_date,
                    Conversation.created_at <= end_date,
                    Conversation.user_id != None,
                )
            )
        )
        unique_users = unique_users_result.scalar() or 0

        return {
            "total_conversations": total_conversations,
            "unique_users": unique_users,
            "fallback_count": fallback_count,
            "helpful_count": helpful_count,
            "total_messages": total_messages,
            "avg_confidence": float(avg_confidence),
            "avg_response_time_ms": float(avg_response_time),
        }

    async def get_fallback_questions(
        self,
        start_date: datetime,
        end_date: datetime,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        result = await self.db.execute(
            select(Message.content, func.count(Message.id).label("count"))
            .where(
                and_(
                    Message.role == "user",
                    Message.is_fallback == True,
                    Message.created_at >= start_date,
                    Message.created_at <= end_date,
                )
            )
            .group_by(Message.content)
            .order_by(func.count(Message.id).desc())
            .limit(limit)
        )
        return [{"question": row.content, "count": row.count} for row in result.all()]
