from datetime import datetime, timedelta
from typing import Any
import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.conversation_repository import ConversationRepository
from app.repositories.document_repository import DocumentRepository
from app.models.admin import DashboardStats, ConversationLog, FallbackQuestion

logger = logging.getLogger(__name__)


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.conversation_repo = ConversationRepository(db)
        self.document_repo = DocumentRepository(db)

    async def get_dashboard_stats(
        self,
        days: int = 7,
    ) -> DashboardStats:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        stats = await self.conversation_repo.get_stats(start_date, end_date)

        doc_stats = await self.document_repo.get_total_chunks()
        total_docs = await self.document_repo.count()

        total_messages = stats.get("total_messages", 1)
        fallback_rate = stats.get("fallback_count", 0) / max(total_messages, 1)
        helpful_rate = stats.get("helpful_count", 0) / max(total_messages, 1)

        return DashboardStats(
            total_conversations=stats.get("total_conversations", 0),
            unique_users=stats.get("unique_users", 0),
            avg_response_time_ms=stats.get("avg_response_time_ms", 0.0),
            avg_confidence_score=stats.get("avg_confidence", 0.0),
            fallback_rate=fallback_rate,
            helpful_rate=helpful_rate,
            active_documents=total_docs,
            total_chunks=doc_stats,
            period_start=start_date,
            period_end=end_date,
        )

    async def get_conversation_logs(
        self,
        page: int = 1,
        page_size: int = 50,
        session_id: str | None = None,
        has_feedback: bool | None = None,
        is_fallback: bool | None = None,
    ) -> tuple[list[ConversationLog], int]:
        offset = (page - 1) * page_size

        messages = await self.conversation_repo.db.execute(
            "SELECT m.*, c.session_id FROM messages m "
            "JOIN conversations c ON m.conversation_id = c.id "
            "WHERE m.role = 'assistant' "
            "ORDER BY m.created_at DESC "
            f"LIMIT {page_size} OFFSET {offset}"
        )
        total = await self.conversation_repo.db.execute(
            "SELECT COUNT(*) FROM messages WHERE role = 'assistant'"
        )

        logs = []
        for row in messages:
            logs.append(ConversationLog(
                id=str(row.id),
                session_id=row.session_id,
                user_query="",
                bot_response=row.content,
                sources=json.loads(row.sources) if row.sources else [],
                confidence=row.confidence or 0.0,
                is_fallback=row.is_fallback,
                feedback=row.feedback,
                response_time_ms=row.response_time_ms or 0,
                created_at=row.created_at,
            ))

        return logs, total.scalar() or 0

    async def get_fallback_questions(
        self,
        days: int = 30,
        limit: int = 10,
    ) -> list[FallbackQuestion]:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        questions = await self.conversation_repo.get_fallback_questions(
            start_date, end_date, limit
        )

        return [
            FallbackQuestion(
                question=q["question"],
                count=q["count"],
                last_seen=end_date,
            )
            for q in questions
        ]

    async def get_top_questions(
        self,
        days: int = 7,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        result = await self.conversation_repo.db.execute(
            "SELECT content, COUNT(*) as count "
            "FROM messages "
            "WHERE role = 'user' "
            f"AND created_at >= '{start_date.isoformat()}' "
            f"AND created_at <= '{end_date.isoformat()}' "
            "GROUP BY content "
            "ORDER BY count DESC "
            f"LIMIT {limit}"
        )

        return [{"question": row.content, "count": row.count} for row in result]
