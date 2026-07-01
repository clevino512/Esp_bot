#!/usr/bin/env python3
"""
SCRIPT DE MIGRATION: Réindexer les documents uploadés existants
Correctif pour les chemins incorrects et l'indexation manquante
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

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


settings = get_settings()


def print_section(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)


async def migrate_and_reindex():
    """Migrer et réindexer tous les documents uploadés"""
    
    print_section("🔄 MIGRATION ET RÉINDEXATION DES DOCUMENTS")
    
    indexer = KnowledgeIndexer()
    loader = DocumentLoader()
    storage_dir = Path(settings.STORAGE_DIR) / "documents"
    
    print(f"\n📂 Répertoire de stockage: {storage_dir}")
    print(f"   Existe: {'✅ OUI' if storage_dir.exists() else '❌ NON'}")
    
    async for db in get_db():
        doc_repo = DocumentRepository(db)
        documents = await doc_repo.list_all(limit=1000)
        
        print(f"\n📊 Total de documents en BD: {len(documents)}")
        
        if not documents:
            print("❌ Aucun document à traiter")
            break
        
        # Catégoriser les documents
        to_migrate = []
        to_reindex = []
        
        print("\n📋 Analyse des documents:")
        print("-" * 80)
        
        for doc in documents:
            status = []
            
            # Vérifier si le fichier existe
            if doc.file_path and os.path.exists(doc.file_path):
                status.append("✅ Chemin OK")
            else:
                status.append("❌ Chemin invalide")
                to_migrate.append(doc)
            
            # Vérifier si indexé
            if doc.chunk_count > 0:
                status.append(f"✅ Indexé ({doc.chunk_count} chunks)")
            else:
                status.append("❌ Non indexé")
                to_reindex.append(doc)
            
            print(f"  • {doc.title}")
            print(f"    {' | '.join(status)}")
        
        # Étape 1: Migrer les chemins
        if to_migrate:
            print(f"\n🔧 ÉTAPE 1: Migration de {len(to_migrate)} document(s)")
            print("-" * 80)
            
            for doc in to_migrate:
                old_path = doc.file_path
                new_path = storage_dir / (doc.filename or f"doc_{doc.id}")
                
                print(f"\n  {doc.title}")
                print(f"    Ancien: {old_path}")
                print(f"    Nouveau: {new_path}")
                
                if old_path and os.path.exists(old_path):
                    print(f"    ✅ Source trouvée")
                    # Copier le fichier
                    storage_dir.mkdir(parents=True, exist_ok=True)
                    try:
                        with open(old_path, 'rb') as src:
                            with open(new_path, 'wb') as dst:
                                dst.write(src.read())
                        print(f"    ✅ Copié vers nouvelle location")
                        
                        # Mettre à jour la BD
                        await doc_repo.update(doc, file_path=str(new_path))
                        print(f"    ✅ BD mise à jour")
                    except Exception as e:
                        print(f"    ❌ Erreur: {e}")
                else:
                    # Chercher dans le bon répertoire
                    alt_path = storage_dir / (doc.filename or "")
                    if alt_path.exists():
                        print(f"    ✅ Fichier trouvé à: {alt_path}")
                        await doc_repo.update(doc, file_path=str(alt_path))
                        print(f"    ✅ BD mise à jour")
                    else:
                        print(f"    ❌ Fichier introuvable aux deux emplacements")
        
        # Étape 2: Réindexer les documents non indexés
        if to_reindex:
            print(f"\n🔍 ÉTAPE 2: Réindexation de {len(to_reindex)} document(s)")
            print("-" * 80)
            
            success_count = 0
            
            for doc in to_reindex:
                print(f"\n  [{success_count+1}/{len(to_reindex)}] {doc.title}")
                
                # Recharger depuis la BD (au cas où elle aurait été mise à jour)
                doc = await doc_repo.get_by_id(doc.id)
                
                if not doc:
                    print(f"    ❌ Document non trouvé en BD")
                    continue
                
                # Essayer de charger le contenu
                content = doc.content_raw or ""
                
                if doc.file_path and os.path.exists(doc.file_path):
                    try:
                        print(f"    📂 Chargement du fichier: {doc.file_path}")
                        loaded_doc = loader.load(doc.file_path)
                        content = loaded_doc.get("content", "")
                        print(f"    ✅ Fichier chargé: {len(content)} caractères")
                    except Exception as e:
                        print(f"    ⚠️  Erreur chargement fichier: {e}")
                        if not content:
                            print(f"    ❌ Pas de contenu disponible, skip")
                            continue
                
                if content:
                    try:
                        # Indexer le document
                        chunk_count = await indexer.index_document(
                            document_id=doc.id,
                            title=doc.title,
                            content=content,
                            category=DocumentCategory[doc.category.upper()] if doc.category else DocumentCategory.GENERAL,
                            metadata={
                                "uploaded_at": str(doc.created_at),
                                "source": "admin_upload"
                            }
                        )
                        
                        # Mettre à jour la BD
                        await doc_repo.update(doc, chunk_count=chunk_count)
                        print(f"    ✅ Indexé: {chunk_count} chunks")
                        success_count += 1
                    except Exception as e:
                        print(f"    ❌ Erreur indexation: {e}")
                else:
                    print(f"    ❌ Pas de contenu à indexer")
        
        # Résumé final
        print_section("📊 RÉSUMÉ FINAL")
        
        stats = indexer.get_stats()
        total_chunks = stats['total_chunks']
        
        print(f"\n✅ Opérations complétées:")
        print(f"   • Documents migrés: {len(to_migrate)}")
        print(f"   • Documents réindexés: {len(to_reindex)}")
        print(f"   • Total de chunks indexés: {total_chunks}")
        
        if total_chunks > 0:
            print(f"\n✅ SUCCESS! Les documents sont maintenant indexés et vectorisés!")
            print(f"   Vos utilisateurs peuvent maintenant poser des questions")
            print(f"   et obtenir des réponses basées sur ces documents.")
        else:
            print(f"\n⚠️  ATTENTION: Aucun chunk indexé!")
            print(f"   Vérifier les fichiers et les logs d'erreur.")
        
        break
    
    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(migrate_and_reindex())
