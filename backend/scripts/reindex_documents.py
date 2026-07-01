#!/usr/bin/env python3
"""
SCRIPT DE RÉINDEXATION - Réindexer tous les documents après les modifications
"""

import asyncio
import logging
import os
from pathlib import Path
import sys

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import get_settings
from app.db.session import get_db
from app.repositories.document_repository import DocumentRepository
from app.knowledge.indexer import KnowledgeIndexer
from app.knowledge.loader import DocumentLoader
from app.config.constants import DocumentCategory
from sqlalchemy.ext.asyncio import AsyncSession

settings = get_settings()


async def reindex_all_documents():
    """Réindexer tous les documents de la base de données"""
    
    print("\n" + "="*80)
    print("  🔄 RÉINDEXATION DES DOCUMENTS")
    print("="*80)
    
    indexer = KnowledgeIndexer()
    
    # Réinitialiser l'index (OPTIONNEL - décommenter si nécessaire)
    # print("\n⚠️  Réinitialisation de l'index... ", end="")
    # indexer.reset()
    # print("✅ Fait")
    
    async for db in get_db():
        doc_repo = DocumentRepository(db)
        loader = DocumentLoader()
        storage_dir = Path(settings.STORAGE_DIR) / "documents"

        # Récupérer tous les documents
        documents = await doc_repo.list_all(limit=1000)

        print(f"\n📊 Statistiques avant réindexation:")
        print(f"   Documents en DB: {len(documents)}")
        print(f"   Chunks indexés: {indexer.get_stats()['total_chunks']}")

        if not documents:
            print("\n❌ Aucun document trouvé en base de données!")
            return

        # Réindexer chaque document
        print(f"\n📝 Réindexation en cours...")
        reindexed_count = 0
        failed_count = 0
        total_chunks = 0

        for doc in documents:
            try:
                print(f"\n   [{reindexed_count+1}/{len(documents)}] {doc.title}")

                content = doc.content_raw or ""
                if not content and doc.file_path:
                    # Vérifier deux emplacements possibles
                    candidate_paths = [Path(doc.file_path)]
                    alt_path = storage_dir / (doc.filename or Path(doc.file_path).name)
                    if alt_path.exists():
                        candidate_paths.append(alt_path)

                    for candidate in candidate_paths:
                        if candidate.exists():
                            print(f"      📂 Chargement du fichier depuis {candidate}")
                            document_data = loader.load(str(candidate))
                            content = document_data.get("content", "")
                            break

                if not content:
                    print("      ❌ Aucun contenu disponible pour indexer")
                    failed_count += 1
                    continue

                chunks = await indexer.index_document(
                    document_id=doc.id,
                    title=doc.title,
                    content=content,
                    category=DocumentCategory[doc.category.upper()] if doc.category else DocumentCategory.GENERAL,
                    filename=doc.filename,
                    metadata={
                        "uploaded_at": str(doc.created_at),
                        "source": "admin_upload"
                    }
                )

                print(f"      ✅ Indexé: {chunks} chunks")
                reindexed_count += 1
                total_chunks += chunks

            except Exception as e:
                print(f"      ❌ Erreur: {str(e)}")
                failed_count += 1

        # Résumé
        stats = indexer.get_stats()
        print(f"\n" + "="*80)
        print(f"  ✅ RÉINDEXATION TERMINÉE")
        print("="*80)
        print(f"  Documents réindexés: {reindexed_count}/{len(documents)}")
        print(f"  Erreurs: {failed_count}")
        print(f"  Total de chunks: {total_chunks}")
        print(f"  Index total: {stats['total_chunks']} chunks")

        if failed_count == 0:
            print(f"\n✅ Réindexation réussie!")
        else:
            print(f"\n⚠️  {failed_count} document(s) ont échoué")

        break


async def validate_indexation():
    """Valider que les documents sont bien indexés"""
    
    print("\n" + "="*80)
    print("  ✔️  VALIDATION DE L'INDEXATION")
    print("="*80)
    
    from app.core.retriever import Retriever
    retriever = Retriever()
    
    stats = retriever.count()
    print(f"\nTotal de chunks indexés: {stats}")
    
    if stats == 0:
        print("❌ Pas de documents indexés! Vérifier l'upload.")
    elif stats < 10:
        print("⚠️  Très peu de documents - envisager d'en ajouter")
    else:
        print(f"✅ {stats} chunks disponibles pour la recherche")
    
    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(reindex_all_documents())
    asyncio.run(validate_indexation())
