import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ["HF_HUB_DISABLE_XET"] = "1"

from sentence_transformers import SentenceTransformer
from app.config.settings import get_settings

settings = get_settings()

print(f"Modèle cible      : {settings.EMBEDDING_MODEL}")
print(f"Répertoire cache  : {settings.HUGGINGFACE_CACHE_DIR}")

os.makedirs(settings.HUGGINGFACE_CACHE_DIR, exist_ok=True)

model = SentenceTransformer(
    settings.EMBEDDING_MODEL,
    cache_folder=settings.HUGGINGFACE_CACHE_DIR,
    device=settings.EMBEDDING_DEVICE,
)

print("✅ Modèle provisionné et opérationnel.")