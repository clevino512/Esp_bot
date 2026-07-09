"""Settings service for retrieving and updating application settings."""

import json
from functools import lru_cache

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Setting
from app.models.settings import SettingsSchema


@lru_cache(maxsize=1)
def _get_default_settings() -> dict:
    """Return default settings values."""
    return {
        "top_k": 5,
        "min_score": 0.65,
        "fallback_threshold": 0.40,
        "chunk_size": 500,
        "chunk_overlap": 50,
        "llm_provider": "openai",
        "llm_model": "gpt-4o-mini",
        "max_tokens": 1000,
        "temperature": 0.2,
        "notify_fallback": True,
        "notify_weekly_report": True,
    }


async def get_settings(db: AsyncSession) -> SettingsSchema:
    """
    Retrieve settings from the database.
    If no settings exist, create default ones.
    """
    # Query for the first (and should be only) settings record
    result = await db.execute(select(Setting).limit(1))
    setting = result.scalar_one_or_none()

    if not setting:
        # Create default settings if none exist
        defaults = _get_default_settings()
        setting = Setting(**defaults)
        db.add(setting)
        await db.commit()
        await db.refresh(setting)

    return SettingsSchema.model_validate(setting)


async def update_settings(db: AsyncSession, payload: SettingsSchema) -> SettingsSchema:
    """
    Update settings in the database.
    If no settings exist, create new ones with the provided values.
    """
    # Query for the first (and should be only) settings record
    result = await db.execute(select(Setting).limit(1))
    setting = result.scalar_one_or_none()

    if not setting:
        # Create new settings with provided values
        setting = Setting(**payload.model_dump())
    else:
        # Update existing settings
        for field, value in payload.model_dump().items():
            setattr(setting, field, value)

    db.add(setting)
    await db.commit()
    await db.refresh(setting)

    return SettingsSchema.model_validate(setting)
