import pytest
from app.knowledge.preprocessor import TextPreprocessor


class TestTextPreprocessor:
    def test_clean_text(self):
        preprocessor = TextPreprocessor()
        text = "  Ceci   est    un   test.  "
        cleaned = preprocessor.clean(text)
        assert "  " not in cleaned
        assert cleaned.startswith("Ceci")

    def test_chunk_text(self):
        preprocessor = TextPreprocessor(chunk_size=100, chunk_overlap=10)
        long_text = "Ceci est un texte. " * 50
        chunks = preprocessor.chunk(long_text)
        assert len(chunks) > 1
        for chunk in chunks:
            assert len(chunk["content"]) > 0

    def test_chunk_with_metadata(self):
        preprocessor = TextPreprocessor()
        text = "Test content for chunking."
        metadata = {"document_id": 1, "title": "Test Document"}
        chunks = preprocessor.chunk(text, metadata)
        for chunk in chunks:
            assert chunk["metadata"]["document_id"] == 1

    def test_extract_keywords(self):
        preprocessor = TextPreprocessor()
        text = """
        L'inscription à l'ESPA se fait au mois de juillet.
        Les étudiants doivent fournir des documents administratifs.
        La scolarité examine chaque dossier d'inscription.
        """
        keywords = preprocessor.extract_keywords(text, max_keywords=5)
        assert len(keywords) <= 5
        assert "inscription" in keywords or "etudiants" in keywords

    def test_compute_hash(self):
        preprocessor = TextPreprocessor()
        text = "Test content"
        hash1 = preprocessor.compute_hash(text)
        hash2 = preprocessor.compute_hash(text)
        assert hash1 == hash2
        assert len(hash1) == 16
