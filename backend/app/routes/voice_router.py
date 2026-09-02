from datetime import datetime
import uuid
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import DatabaseDep, OptionalUserDep
from app.voice.asr import ASREngine
from app.voice.tts import TTSEngine
from app.models.voice import VoiceTranscriptionResponse
from app.models.base import BaseResponse
from app.models.student import StudentVerification

router = APIRouter(prefix="/voice", tags=["Voice"])


@router.post("/transcribe", response_model=VoiceTranscriptionResponse)
async def transcribe_audio(
    db: DatabaseDep,
    audio: UploadFile = File(...),
    session_id: str | None = Form(None),
    language: str = Form("fr"),
    current_user: OptionalUserDep = None,
):
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid audio file",
        )

    audio_data = await audio.read()

    if len(audio_data) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Audio file too large (max 10MB)",
        )

    asr = ASREngine(language=language)
    result = await asr.transcribe(audio_data)

    return VoiceTranscriptionResponse(
        id=str(uuid.uuid4()),
        text=result["text"],
        language=result["language"],
        duration_seconds=result["duration_seconds"],
        confidence=result["confidence"],
    )


@router.post("/synthesize")
async def synthesize_speech(
    text: str = Form(...),
    language: str = Form("fr"),
):
    if len(text) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text too long (max 2000 characters)",
        )

    tts = TTSEngine(language=language)
    audio_data = await tts.synthesize(text)

    from fastapi.responses import Response
    return Response(
        content=audio_data,
        media_type="audio/wav",
        headers={
            "Content-Disposition": "attachment; filename=synthesized.wav",
        },
    )


@router.post("/chat", response_model=dict)
async def voice_chat(
    db: DatabaseDep,
    audio: UploadFile = File(...),
    session_id: str | None = Form(None),
    language: str = Form("fr"),
    student_full_name: str | None = Form(None),
    student_identifier: str | None = Form(None),
    current_user: OptionalUserDep = None,
):
    from app.services.chat_service import ChatService

    audio_data = await audio.read()

    asr = ASREngine(language=language)
    transcription = await asr.transcribe(audio_data)

    if not transcription["text"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not transcribe audio",
        )

    chat_service = ChatService(db)
    try:
        response = await chat_service.process_message(
            user_message=transcription["text"],
            session_id=session_id,
            student_verification=(
                StudentVerification(
                    full_name=student_full_name,
                    student_identifier=student_identifier,
                )
                if student_full_name and student_identifier
                else None
            ),
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    return {
        "transcription": {
            "text": transcription["text"],
            "confidence": transcription["confidence"],
        },
        "response": response.model_dump(),
    }
