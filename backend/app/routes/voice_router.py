import uuid
import json
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.dependencies import DatabaseDep, OptionalUserDep
from app.voice.asr import ASREngine, SUPPORTED_WHISPER_MODELS
from app.voice.tts import TTSEngine
from app.models.voice import VoiceTranscriptionResponse
from app.models.student import StudentVerification
from app.voice.upload import AudioUploadError, MAX_AUDIO_BYTES, validate_audio_upload

router = APIRouter(prefix="/voice", tags=["Voice"])


async def _read_audio(audio: UploadFile) -> tuple[bytes, str]:
    try:
        data = await audio.read(MAX_AUDIO_BYTES + 1)
        suffix = validate_audio_upload(audio.filename, audio.content_type, data)
        return data, suffix
    except AudioUploadError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    finally:
        await audio.close()


def _parse_history(history_json: str | None) -> list[dict[str, str]] | None:
    if not history_json:
        return None
    try:
        parsed = json.loads(history_json)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Historique vocal invalide.") from exc
    if not isinstance(parsed, list):
        raise HTTPException(status_code=400, detail="Historique vocal invalide.")
    safe_history = []
    for item in parsed[-6:]:
        if (
            not isinstance(item, dict)
            or item.get("role") not in {"user", "assistant"}
            or not isinstance(item.get("content"), str)
        ):
            raise HTTPException(status_code=400, detail="Historique vocal invalide.")
        safe_history.append({"role": item["role"], "content": item["content"][:10_000]})
    return safe_history


@router.post("/transcribe", response_model=VoiceTranscriptionResponse)
async def transcribe_audio(db: DatabaseDep, audio: UploadFile = File(...), session_id: str | None = Form(None), language: str = Form("fr"), model: str = Form("base"), current_user: OptionalUserDep = None):
    if model not in SUPPORTED_WHISPER_MODELS:
        raise HTTPException(status_code=400, detail="model must be tiny, base or medium")
    audio_data, suffix = await _read_audio(audio)
    try:
        result = await ASREngine(language=language, model_name=model).transcribe(audio_data, suffix=suffix)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="La transcription audio a échoué. Vérifiez le format et réessayez.") from exc
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
    engine = TTSEngine(language=language)
    audio_data = await engine.synthesize(text)
    from fastapi.responses import Response
    media_type = "audio/mpeg" if engine.engine == "gtts" else "audio/wav"
    extension = "mp3" if engine.engine == "gtts" else "wav"
    return Response(content=audio_data, media_type=media_type, headers={"Content-Disposition": f"attachment; filename=synthesized.{extension}"})


@router.post("/chat", response_model=dict)
async def voice_chat(db: DatabaseDep, audio: UploadFile = File(...), session_id: str | None = Form(None), language: str = Form("fr"), history: str | None = Form(None), student_full_name: str | None = Form(None), student_identifier: str | None = Form(None), current_user: OptionalUserDep = None):
    from app.services.chat_service import ChatService
    audio_data, suffix = await _read_audio(audio)
    try:
        conversation_history = _parse_history(history)
        transcription = await ASREngine(language=language).transcribe(audio_data, suffix=suffix)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="La transcription audio a échoué. Vérifiez le format et réessayez.") from exc
    if not transcription["text"]:
        raise HTTPException(status_code=400, detail="Could not transcribe audio")
    try:
        response = await ChatService(db).process_message(
            user_message=transcription["text"], session_id=session_id,
            history=conversation_history, mode="voice",
            student_verification=(StudentVerification(full_name=student_full_name, student_identifier=student_identifier) if student_full_name and student_identifier else None),
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Le chatbot n’a pas pu traiter ce message vocal. Réessayez.") from exc
    return {
        "transcription": {"text": transcription["text"], "confidence": transcription["confidence"], "model": transcription["model"], "processing_time_ms": transcription["processing_time_ms"], "real_time_factor": transcription["real_time_factor"]},
        "response": response.model_dump(),
    }