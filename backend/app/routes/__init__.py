from .auth_router import router as auth_router
from .chat_router import router as chat_router
from .voice_router import router as voice_router
from .admin_router import router as admin_router
from .settings_router import router as settings_router

__all__ = ["auth_router", "chat_router", "voice_router", "admin_router", "settings_router"]

