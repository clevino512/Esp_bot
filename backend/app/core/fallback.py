from typing import Any
import logging

from app.config import get_settings
from app.core.llm_client import LLMClient
from app.core.prompts import PromptTemplates

logger = logging.getLogger(__name__)
settings = get_settings()


class FallbackHandler:
    def __init__(
        self,
        threshold: float | None = None,
    ):
        self.threshold = threshold or settings.FALLBACK_THRESHOLD
        self.llm_client = LLMClient()

    def should_fallback(self, sources: list[dict[str, Any]]) -> bool:
        if not sources:
            return True

        max_relevance = max(s.get("relevance_score", 0) for s in sources)
        avg_relevance = sum(s.get("relevance_score", 0) for s in sources) / len(sources)

        # ✅ CORRIGÉ: Utiliser la moyenne au lieu du max pour une meilleure décision
        # Cette approche est plus robuste quand on a plusieurs sources partielles
        if max_relevance < self.threshold or avg_relevance < (self.threshold * 0.8):
            logger.info(
                f"Fallback triggered: max_relevance={max_relevance:.3f}, "
                f"avg_relevance={avg_relevance:.3f}, threshold={self.threshold}"
            )
            return True

        return False

    async def generate_fallback_response(
        self,
        question: str,
        partial_sources: list[dict[str, Any]] | None = None,
    ) -> str:
        if partial_sources and len(partial_sources) > 0:
            context = self._format_partial_context(partial_sources)
            prompt = PromptTemplates.format_rag_prompt(question, context)
        else:
            prompt = PromptTemplates.format_fallback_prompt(question)

        response = await self.llm_client.generate(
            system_prompt=PromptTemplates.SYSTEM_PROMPT,
            user_prompt=prompt,
        )
        return response

    def _format_partial_context(self, sources: list[dict[str, Any]]) -> str:
        formatted = []
        for s in sources[:3]:
            metadata = s.get("metadata", {})
            title = metadata.get("title", "Document")
            content = s.get("content", "")
            relevance = s.get("relevance_score", 0)
            formatted.append(f"[{title} (pertinence: {relevance:.1%})]\n{content}")
        return "\n\n".join(formatted)

    def get_contact_suggestions(self, question_category: str | None = None) -> str:
        contacts = {
            "admission": "Service des admissions: admission@espa.mg",
            "inscription": "Service de la scolarité: scolarite@espa.mg",
            "examens": "Service des examens: examens@espa.mg",
            "notes": "Service de la scolarité: scolarite@espa.mg",
            "boursers": "Service des bourses: bourses@espa.mg",
            "stages": "Service des stages: stages@espa.mg",
            "default": "Secrétariat: secretariat@espa.mg",
        }

        category = question_category or "default"
        contact = contacts.get(category, contacts["default"])

        return f"Pour plus d'informations, veuillez contacter: {contact}"
