import pytest
from app.core.embedder import Embedder
from app.core.fallback import FallbackHandler
from app.core.prompts import PromptTemplates


class TestEmbedder:
    def test_embedder_initialization(self):
        embedder = Embedder()
        assert embedder.model_name is not None
        assert embedder.device is not None

    def test_embed_single(self):
        embedder = Embedder()
        embedding = embedder.embed_single("Ceci est un test")
        assert len(embedding) > 0
        assert all(isinstance(x, float) for x in embedding)


class TestFallbackHandler:
    def test_should_fallback_empty_sources(self):
        handler = FallbackHandler()
        assert handler.should_fallback([]) is True

    def test_should_fallback_low_relevance(self):
        handler = FallbackHandler()
        sources = [{"relevance_score": 0.2}]
        assert handler.should_fallback(sources) is True

    def test_should_not_fallback_high_relevance(self):
        handler = FallbackHandler(threshold=0.5)
        sources = [{"relevance_score": 0.8}]
        assert handler.should_fallback(sources) is False


class TestPromptTemplates:
    def test_system_prompt_not_empty(self):
        assert PromptTemplates.SYSTEM_PROMPT
        assert len(PromptTemplates.SYSTEM_PROMPT) > 100

    def test_format_rag_prompt(self):
        prompt = PromptTemplates.format_rag_prompt(
            question="Comment s'inscrire?",
            context="Les inscriptions sont ouvertes du 1er juillet au 31 aout."
        )
        assert "Comment s'inscrire?" in prompt
        assert "inscriptions" in prompt

    def test_format_fallback_prompt(self):
        prompt = PromptTemplates.format_fallback_prompt("Question hors domaine")
        assert "Question hors domaine" in prompt
        assert "n'ai pas" in prompt.lower() or "pas d'information" in prompt.lower()
