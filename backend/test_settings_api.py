"""Test script to validate settings API endpoints."""

import asyncio
import json
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Simulate the database and models
DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# Import after setting up the database
import sys
sys.path.insert(0, '.')

from app.db.models import Setting
from app.models.settings import SettingsSchema
from app.services.settings_service import get_settings, update_settings


async def test_settings_flow():
    """Test the complete settings flow."""
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Test 1: Get default settings (should auto-create)
    async with async_session_maker() as session:
        settings1 = await get_settings(session)
        print(f"✅ Retrieved default settings: top_k={settings1.top_k}, min_score={settings1.min_score}")
        assert settings1.top_k == 5
        assert settings1.min_score == 0.65
    
    # Test 2: Update settings
    async with async_session_maker() as session:
        updated_payload = SettingsSchema(
            top_k=7,
            min_score=0.75,
            fallback_threshold=0.40,
            chunk_size=500,
            chunk_overlap=50,
            llm_provider="ollama",
            llm_model="mistral:7b",
            max_tokens=1000,
            temperature=0.3,
            notify_fallback=False,
            notify_weekly_report=True,
        )
        result = await update_settings(session, updated_payload)
        print(f"✅ Updated settings: top_k={result.top_k}, llm_provider={result.llm_provider}")
        assert result.top_k == 7
        assert result.min_score == 0.75
        assert result.llm_provider == "ollama"
    
    # Test 3: Verify persistence (fetch again)
    async with async_session_maker() as session:
        settings3 = await get_settings(session)
        print(f"✅ Verified persistence: top_k={settings3.top_k}, temperature={settings3.temperature}")
        assert settings3.top_k == 7
        assert settings3.temperature == 0.3
    
    print("\n✅ All tests passed!")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(test_settings_flow())
