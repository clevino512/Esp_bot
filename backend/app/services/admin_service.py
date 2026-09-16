from datetime import datetime, timedelta
from typing import Any
import json
import logging

from sqlalchemy import text
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

    async def get_dashboard_stats(self, days: int = 7) -> DashboardStats:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        stats = await self.conversation_repo.get_stats(start_date, end_date)
        doc_stats = await self.document_repo.get_total_chunks()
        total_messages = stats.get("total_messages", 0)
        fallback_rate = stats.get("fallback_count", 0) / max(total_messages, 1)
        feedback_count = stats.get("helpful_count", 0) + stats.get("not_helpful_count", 0)
        helpful_rate = stats.get("helpful_count", 0) / max(feedback_count, 1)
        return DashboardStats(
            total_conversations=stats.get("total_conversations_all_time", 0), unique_users=stats.get("unique_users", 0),
            avg_response_time_ms=stats.get("avg_response_time_ms", 0.0), avg_confidence_score=stats.get("avg_confidence", 0.0),
            fallback_rate=fallback_rate, helpful_rate=helpful_rate,
            active_documents=await self.document_repo.count(is_active=True), total_chunks=doc_stats,
            period_start=start_date, period_end=end_date,
        )

    async def get_pfe_evaluation_stats(self, days: int = 30) -> dict[str, Any]:
        """Metrics required by the PFE pilot, calculated only from real persisted interactions."""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        stmt = text("""
            SELECT
                COUNT(*) FILTER (WHERE m.role = 'user') AS total_queries,
                COUNT(*) FILTER (WHERE m.role = 'user' AND m.sources LIKE '%\"interaction_mode\": \"voice\"%') AS voice_queries,
                COUNT(*) FILTER (WHERE m.role = 'user' AND (m.sources IS NULL OR m.sources NOT LIKE '%\"interaction_mode\": \"voice\"%')) AS text_queries,
                COUNT(*) FILTER (WHERE m.role = 'assistant') AS assistant_answers,
                COUNT(*) FILTER (WHERE m.role = 'assistant' AND m.is_fallback = TRUE) AS fallback_answers,
                COUNT(*) FILTER (WHERE m.role = 'assistant' AND m.feedback = 'HELPFUL') AS helpful_answers,
                COUNT(*) FILTER (WHERE m.role = 'assistant' AND m.feedback = 'NOT_HELPFUL') AS not_helpful_answers,
                AVG(m.response_time_ms) FILTER (WHERE m.role = 'assistant' AND m.response_time_ms IS NOT NULL) AS avg_response_time_ms,
                COUNT(DISTINCT m.conversation_id) AS sessions
            FROM messages m
            WHERE m.created_at >= :start_date AND m.created_at <= :end_date
        """)
        row = (await self.db.execute(stmt, {"start_date": start_date, "end_date": end_date})).mappings().one()
        total = int(row["total_queries"] or 0)
        voice = int(row["voice_queries"] or 0)
        text_count = int(row["text_queries"] or 0)
        answers = int(row["assistant_answers"] or 0)
        fallbacks = int(row["fallback_answers"] or 0)
        helpful = int(row["helpful_answers"] or 0)
        not_helpful = int(row["not_helpful_answers"] or 0)
        feedback_total = helpful + not_helpful
        return {
            "period_days": days, "period_start": start_date, "period_end": end_date,
            "sessions": int(row["sessions"] or 0), "total_queries": total,
            "text_queries": text_count, "voice_queries": voice,
            "voice_usage_rate": voice / total if total else 0.0,
            "text_usage_rate": text_count / total if total else 0.0,
            "fallback_rate": fallbacks / answers if answers else 0.0,
            "resolution_rate": (answers - fallbacks) / answers if answers else 0.0,
            "helpful_rate": helpful / feedback_total if feedback_total else 0.0,
            "feedback_count": feedback_total,
            "avg_response_time_ms": float(row["avg_response_time_ms"] or 0.0),
        }

    async def get_conversation_logs(self, page: int = 1, page_size: int = 50, session_id: str | None = None, has_feedback: bool | None = None, is_fallback: bool | None = None) -> tuple[list[ConversationLog], int]:
        offset = (page - 1) * page_size
        stmt = text("""
            SELECT m.id, m.content AS bot_response, m.sources, m.confidence, m.is_fallback,
                   m.feedback, m.response_time_ms, m.created_at, c.session_id,
                   (SELECT um.content FROM messages um WHERE um.conversation_id = m.conversation_id
                    AND um.role = 'user' AND um.id < m.id ORDER BY um.id DESC LIMIT 1) AS user_query
            FROM messages m JOIN conversations c ON m.conversation_id = c.id
            WHERE m.role = 'assistant' ORDER BY m.created_at DESC LIMIT :limit OFFSET :offset
        """)
        messages = await self.conversation_repo.db.execute(stmt, {"limit": page_size, "offset": offset})
        total_result = await self.conversation_repo.db.execute(text("SELECT COUNT(*) FROM messages WHERE role = 'assistant'"))
        logs = [ConversationLog(
            id=str(row["id"]), session_id=row["session_id"], user_query=row["user_query"] or "",
            bot_response=row["bot_response"], sources=json.loads(row["sources"]) if row["sources"] else [],
            confidence=row["confidence"] or 0.0, is_fallback=row["is_fallback"], feedback=row["feedback"],
            response_time_ms=row["response_time_ms"] or 0, created_at=row["created_at"],
        ) for row in messages.mappings()]
        return logs, total_result.scalar() or 0

    async def get_fallback_questions(self, days: int = 30, limit: int = 10) -> list[FallbackQuestion]:
        end_date = datetime.utcnow(); start_date = end_date - timedelta(days=days)
        questions = await self.conversation_repo.get_fallback_questions(start_date, end_date, limit)
        return [FallbackQuestion(question=q["question"], count=q["count"], last_seen=end_date) for q in questions]

    async def get_top_questions(self, days: int = 7, limit: int = 10) -> list[dict[str, Any]]:
        end_date = datetime.utcnow(); start_date = end_date - timedelta(days=days)
        stmt = text("""SELECT content, COUNT(*) AS count FROM messages WHERE role = 'user'
                     AND created_at >= :start_date AND created_at <= :end_date
                     GROUP BY content ORDER BY count DESC LIMIT :limit""")
        result = await self.conversation_repo.db.execute(stmt, {"start_date": start_date, "end_date": end_date, "limit": limit})
        return [{"question": row["content"], "count": row["count"]} for row in result.mappings()]