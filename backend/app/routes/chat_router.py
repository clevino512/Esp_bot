from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import DatabaseDep, OptionalUserDep
from app.services.chat_service import ChatService
from app.models.chat import ChatRequest, ChatResponse, FeedbackRequest, ConversationHistory
from app.models.base import BaseResponse

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    db: DatabaseDep,
    current_user: OptionalUserDep = None,
):
    chat_service = ChatService(db)
    response = await chat_service.process_message(
        user_message=request.message,
        session_id=request.session_id,
        history=request.history,
    )
    return response


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
