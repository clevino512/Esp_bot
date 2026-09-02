import json
import logging
import os
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import DatabaseDep, OptionalUserDep
from app.services.chat_service import ChatService
from app.models.chat import ChatRequest, ChatResponse, FeedbackRequest, ConversationHistory
from app.models.sus import SUSFeedbackRequest
from app.models.base import BaseResponse

SUS_STORE_PATH = os.path.join(os.path.dirname(__file__), "../../data/sus_responses.json")
logger = logging.getLogger(__name__)


def _load_sus_responses() -> list[dict]:
    try:
        with open(SUS_STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _save_sus_response(record: dict) -> None:
    os.makedirs(os.path.dirname(SUS_STORE_PATH), exist_ok=True)
    records = _load_sus_responses()
    records.append(record)
    with open(SUS_STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    db: DatabaseDep,
    current_user: OptionalUserDep = None,
):
    try:
        chat_service = ChatService(db)
        response = await chat_service.process_message(
            user_message=request.message,
            session_id=request.session_id,
            history=request.history,
            student_verification=request.student_verification,
        )
        return response
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Chat message processing failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc


@router.get("/history/{session_id}", response_model=ConversationHistory)
async def get_history(
    session_id: str,
    db: DatabaseDep,
):
    chat_service = ChatService(db)
    messages = await chat_service.get_history(session_id)
    if not messages:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return ConversationHistory(
        session_id=session_id,
        messages=messages,
        created_at=messages[0].created_at if messages else datetime.utcnow(),
        updated_at=messages[-1].created_at if messages else datetime.utcnow(),
    )


@router.post("/feedback", response_model=BaseResponse)
async def submit_feedback(
    request: FeedbackRequest,
    db: DatabaseDep,
):
    chat_service = ChatService(db)
    success = await chat_service.submit_feedback(
        message_id=request.message_id,
        feedback_type=request.feedback.value,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
    return BaseResponse(
        success=True,
        message="Feedback submitted successfully",
    )


@router.post("/sus-feedback", response_model=BaseResponse)
async def submit_sus_feedback(request: SUSFeedbackRequest):
    record = {
        "id": str(uuid.uuid4()),
        "session_id": request.session_id,
        "responses": request.responses,
        "score": request.score,
        "created_at": datetime.utcnow().isoformat(),
    }
    _save_sus_response(record)
    return BaseResponse(success=True, message="SUS feedback recorded")


@router.delete("/conversation/{session_id}", response_model=BaseResponse)
async def clear_conversation(
    session_id: str,
    db: DatabaseDep,
):
    chat_service = ChatService(db)
    success = await chat_service.clear_conversation(session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return BaseResponse(
        success=True,
        message="Conversation cleared successfully",
    )
