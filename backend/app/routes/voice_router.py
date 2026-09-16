import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form

from app.dependencies import DatabaseDep, OptionalUserDep
from app.voice.asr import ASREngine, SUPPORTED_WHISPER_MODELS
from app.voice.tts import TTSEngine
from app.models.voice import VoiceTranscriptionResponse
from app.models.student import StudentVerification

router = APIRouter(prefix="/voice", tags=["Voice"])
ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".webm", ".flac"}
MAX_AUDIO_BYTES = 10 * 1024 * 1024


async def _read_audio(audio: UploadFile) -> tuple[bytes, str]:
    suffix = Path(audio.filename or "audio.wav").suffix.lower() or ".wav"
    if suffix not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported audio format. Allowed: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}")
    if audio.content_type and not (audio.content_type.startswith("audio/") or audio.content_type in {"application/octet-stream", "video/webm"}):
        raise HTTPException(status_code=400, detail="Invalid audio file")
    data = await audio.read(MAX_AUDIO_BYTES + 1)
    if not data:
        raise HTTPException(status_code=400, detail="Empty audio file")
    if len(data) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Audio file too large (max 10MB)")
    return data, suffix


@router.post("/transcribe", response_model=VoiceTranscriptionResponse)
async def transcribe_audio(db: DatabaseDep, audio: UploadFile = File(...), session_id: str | None = Form(None), language: str = Form("fr"), model: str = Form("base"), current_user: OptionalUserDep = None):
    if model not in SUPPORTED_WHISPER_MODELS:
        raise HTTPException(status_code=400, detail="model must be tiny, base or medium")
    audio_data, suffix = await _read_audio(audio)
    try:
        result = await ASREngine(language=language, model_name=model).transcribe(audio_data, suffix=suffix)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Audio transcription failed: {exc}") from exc
    return VoiceTranscriptionResponse(
        id=str(uuid.uuid4()), text=result["text"], language=result["language"],
        duration_seconds=result["duration_seconds"], confidence=result["confidence"],
        processing_time_ms=result["processing_time_ms"], real_time_factor=result["real_time_factor"],
        engine=result["engine"], model=result["model"],
    )


@router.post("/synthesize")
async def synthesize_speech(text: str = Form(...), language: str = Form("fr")):
    if len(text) > 2000:
        raise HTTPException(status_code=400, detail="Text too long (max 2000 characters)")
    audio_data = await TTSEngine(language=language).synthesize(text)
    from fastapi.responses import Response
    return Response(content=audio_data, media_type="audio/wav", headers={"Content-Disposition": "attachment; filename=synthesized.wav"})


@router.post("/chat", response_model=dict)
async def voice_chat(db: DatabaseDep, audio: UploadFile = File(...), session_id: str | None = Form(None), language: str = Form("fr"), student_full_name: str | None = Form(None), student_identifier: str | None = Form(None), current_user: OptionalUserDep = None):
    from app.services.chat_service import ChatService
    audio_data, suffix = await _read_audio(audio)
    transcription = await ASREngine(language=language).transcribe(audio_data, suffix=suffix)
    if not transcription["text"]:
        raise HTTPException(status_code=400, detail="Could not transcribe audio")
    try:
        response = await ChatService(db).process_message(
            user_message=transcription["text"], session_id=session_id, mode="voice",
            student_verification=(StudentVerification(full_name=student_full_name, student_identifier=student_identifier) if student_full_name and student_identifier else None),
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return {
        "transcription": {"text": transcription["text"], "confidence": transcription["confidence"], "model": transcription["model"], "processing_time_ms": transcription["processing_time_ms"], "real_time_factor": transcription["real_time_factor"]},
        "response": response.model_dump(),
    }