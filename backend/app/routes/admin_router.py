from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import DatabaseDep, CurrentUserDep, get_current_admin
from app.services.document_service import DocumentService
from app.services.admin_service import AdminService
from app.models.document import DocumentCreate, DocumentUpdate, DocumentResponse, DocumentListResponse
from app.models.admin import DashboardStats, ConversationLog, FallbackQuestion
from app.models.base import BaseResponse
from app.config.constants import DocumentCategory

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    db: DatabaseDep,
    days: int = Query(7, ge=1, le=90),
    current_user = Depends(get_current_admin),
):
    admin_service = AdminService(db)
    return await admin_service.get_dashboard_stats(days=days)


@router.get("/conversations", response_model=dict)
async def get_conversations(
    db: DatabaseDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_admin),
):
    admin_service = AdminService(db)
    logs, total = await admin_service.get_conversation_logs(page=page, page_size=page_size)
    return {
        "logs": logs,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/fallback-questions", response_model=list[FallbackQuestion])
async def get_fallback_questions(
    db: DatabaseDep,
    days: int = Query(30, ge=1, le=90),
    limit: int = Query(10, ge=1, le=50),
    current_user = Depends(get_current_admin),
):
    admin_service = AdminService(db)
    return await admin_service.get_fallback_questions(days=days, limit=limit)


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    db: DatabaseDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: DocumentCategory | None = Query(None),
    is_active: bool | None = Query(None),
    current_user = Depends(get_current_admin),
):
    doc_service = DocumentService(db)
    docs, total = await doc_service.list_documents(
        category=category,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )
    return DocumentListResponse(
        documents=docs,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    db: DatabaseDep,
    document_data: DocumentCreate,
    current_user = Depends(get_current_admin),
):
    doc_service = DocumentService(db)
    return await doc_service.create_document(
        title=document_data.title,
        category=document_data.category,
    )


@router.post("/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    db: DatabaseDep,
    file: UploadFile = File(...),
    title: str | None = Form(None),
    category: DocumentCategory = Form(DocumentCategory.GENERAL),
    current_user = Depends(get_current_admin),
):
    doc_service = DocumentService(db)
    file_data = await file.read()
    return await doc_service.upload_document(
        file_data=file_data,
        filename=file.filename or "document",
        title=title,
        category=category,
    )


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: DatabaseDep,
    current_user = Depends(get_current_admin),
):
    doc_service = DocumentService(db)
    doc = await doc_service.get_document(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return doc


@router.patch("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    update_data: DocumentUpdate,
    db: DatabaseDep,
    current_user = Depends(get_current_admin),
):
    doc_service = DocumentService(db)
    doc = await doc_service.update_document(document_id, update_data)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return doc


@router.delete("/documents/{document_id}", response_model=BaseResponse)
async def delete_document(
    document_id: int,
    db: DatabaseDep,
    current_user = Depends(get_current_admin),
):
    doc_service = DocumentService(db)
    success = await doc_service.delete_document(document_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return BaseResponse(
        success=True,
        message="Document deleted successfully",
    )


@router.post("/documents/{document_id}/reindex", response_model=BaseResponse)
async def reindex_document(
    document_id: int,
    db: DatabaseDep,
    current_user = Depends(get_current_admin),
):
    doc_service = DocumentService(db)
    chunk_count = await doc_service.reindex_document(document_id)
    return BaseResponse(
        success=True,
        message=f"Document reindexed with {chunk_count} chunks",
    )


@router.get("/stats", response_model=dict)
async def get_stats(
    db: DatabaseDep,
    current_user = Depends(get_current_admin),
):
    doc_service = DocumentService(db)
    return await doc_service.get_stats()
