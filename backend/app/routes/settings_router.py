from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.settings import SettingsSchema
from app.services.settings_service import get_settings, update_settings

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/", response_model=SettingsSchema)
async def read_settings(db: AsyncSession = Depends(get_db)) -> SettingsSchema:
    """
    Retrieve current application settings.
    Returns default settings if none are configured yet.
    """
    return await get_settings(db)


@router.put("/", response_model=SettingsSchema)
async def put_settings(payload: SettingsSchema, db: AsyncSession = Depends(get_db)) -> SettingsSchema:
    """
    Update application settings.
    All fields are updated in a single operation.
    """
    return await update_settings(db, payload)