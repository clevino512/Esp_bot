from app.models.voice import VoiceTranscriptionResponse


def test_voice_response_generates_created_at():
    response = VoiceTranscriptionResponse(
        id="test",
        text="bonjour",
        language="fr",
        duration_seconds=1.0,
        confidence=0.9,
        processing_time_ms=100.0,
        real_time_factor=0.1,
        engine="whisper",
        model="base",
    )
    assert response.created_at is not None
    assert response.model == "base"
