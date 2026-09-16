import pytest

from app.voice.asr import ASREngine


def test_whisper_model_validation():
    for model in ("tiny", "base", "medium"):
        engine = ASREngine(mode="whisper", model_name=model)
        assert engine.model_name == model


def test_unknown_whisper_model_is_rejected():
    with pytest.raises(ValueError):
        ASREngine(mode="whisper", model_name="unknown")
