#!/usr/bin/env python3
"""
DIAGNOSTIC COMPLET: Upload + Stockage + Indexation + Vectorisation
Vérifie le flux complet des documents uploadés
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
from app.core.retriever import Retriever
from app.knowledge.loader import DocumentLoader


settings = get_settings()


def print_section(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)


async def diagnose_upload_flow():
    """Diagnostic complet du flux: Upload → Stockage → BD → Indexation → Vectorisation"""
    
    print_section("🔍 DIAGNOSTIC COMPLET: FLUX DOCUMENT UPLOADÉ")
    
    # 1. Vérifier les chemins configurés
    print("\n1️⃣  CONFIGURATION DES CHEMINS")
    print("-" * 80)
    
    print(f"HUGGINGFACE_CACHE_DIR: {settings.HUGGINGFACE_CACHE_DIR}")
    hf_parent = Path(settings.HUGGINGFACE_CACHE_DIR).parent
    print(f"  → Parent: {hf_parent}")
    print(f"  → Chemin généré par document_service: {hf_parent / 'documents'}")
    
    storage_path = Path("/app/storage/documents") if os.path.exists("/app/storage/documents") else Path("storage/documents")
    print(f"\nStockage réel utilisé: {storage_path}")
    
    if storage_path.exists():
        print(f"✅ Répertoire {storage_path} existe")
        files = list(storage_path.glob("*"))
        print(f"📊 Fichiers stockés: {len(files)}")
        for f in files[:5]:
            size_mb = f.stat().st_size / (1024*1024)
            print(f"   - {f.name} ({size_mb:.2f} MB)")
    else:
        print(f"❌ Répertoire {storage_path} n'existe PAS")
    
    # 2. Vérifier les documents en base de données
    print("\n2️⃣  DOCUMENTS EN BASE DE DONNÉES")
    print("-" * 80)
    
    async for db in get_db():
        doc_repo = DocumentRepository(db)
        documents = await doc_repo.list_all(limit=100)
        
        print(f"📊 Total de documents en BD: {len(documents)}")
        
        if not documents:
            print("❌ Aucun document en base de données!")
            break
        
        for doc in documents:
            print(f"\n   📄 Document ID={doc.id}: {doc.title}")
            print(f"      Fichier: {doc.filename}")
            print(f"      Chemin stocké: {doc.file_path}")
            print(f"      Taille: {doc.file_size} bytes")
            print(f"      Chunks indexés: {doc.chunk_count}")
            print(f"      Catégorie: {doc.category}")
            print(f"      Actif: {doc.is_active}")
            print(f"      Contenu raw: {len(doc.content_raw or '')} caractères")
            
            # Vérifier si le fichier existe vraiment
            if doc.file_path:
                file_exists = os.path.exists(doc.file_path)
                print(f"      Fichier existe: {'✅ OUI' if file_exists else '❌ NON'}")
                
                if not file_exists and storage_path.exists():
                    # Chercher dans le bon répertoire
                    alt_path = storage_path / (doc.filename or "")
                    alt_exists = alt_path.exists()
                    print(f"      Fichier au bon chemin ({alt_path}): {'✅ OUI' if alt_exists else '❌ NON'}")
        
        break
    
    # 3. Vérifier l'indexation ChromaDB
    print("\n3️⃣  VÉRIFICATION DE L'INDEXATION (ChromaDB)")
    print("-" * 80)
    
    retriever = Retriever()
    total_chunks = retriever.count()
    print(f"📊 Total de chunks indexés: {total_chunks}")
    
    if total_chunks == 0:
        print("❌ CRITIQUE: Aucun chunk indexé!")
        print("   → Les documents ne sont PAS vectorisés")
        print("   → Le RAG ne peut pas retrouver de documents")
    else:
        print(f"✅ {total_chunks} chunks disponibles pour recherche")
    
    # 4. Tester la chargement d'un document
    print("\n4️⃣  TEST DE CHARGEMENT DE DOCUMENT")
    print("-" * 80)
    
    loader = DocumentLoader()
    
    async for db in get_db():
        doc_repo = DocumentRepository(db)
        documents = await doc_repo.list_all(limit=1)
        
        if documents:
            doc = documents[0]
            print(f"\n   Test avec: {doc.filename}")
            
            if doc.file_path and os.path.exists(doc.file_path):
                try:
                    loaded_doc = loader.load(doc.file_path)
                    content_len = len(loaded_doc.get("content", ""))
                    print(f"   ✅ Fichier chargé avec succès")
                    print(f"      Contenu extrait: {content_len} caractères")
                except Exception as e:
                    print(f"   ❌ Erreur lors du chargement: {e}")
            else:
                print(f"   ❌ Fichier introuvable: {doc.file_path}")
                
                # Chercher au bon endroit
                if storage_path.exists():
                    alt_path = storage_path / (doc.filename or "")
                    if alt_path.exists():
                        print(f"   💡 Fichier TROUVÉ au bon chemin: {alt_path}")
                        try:
                            loaded_doc = loader.load(str(alt_path))
                            content_len = len(loaded_doc.get("content", ""))
                            print(f"   ✅ Peut être chargé depuis: {alt_path}")
                            print(f"      Contenu: {content_len} caractères")
                        except Exception as e:
                            print(f"   ❌ Erreur lors du chargement: {e}")
        
        break
    
    # 5. Test de retrieval
    print("\n5️⃣  TEST DE RETRIEVAL (Récupération)")
    print("-" * 80)
    
    test_queries = [
        "diplôme",
        "supervisor",
        "station",
        "documento",
    ]
    
    found_any = False
    for query in test_queries:
        sources = retriever.retrieve(query)
        if sources:
            found_any = True
            print(f"\n   Query: '{query}'")
            print(f"   ✅ {len(sources)} résultats trouvés")
            for i, source in enumerate(sources[:2], 1):
                relevance = source.get("relevance_score", 0)
                title = source.get("metadata", {}).get("title", "?")
                print(f"      {i}. [{relevance:.2%}] {title[:50]}")
    
    if not found_any:
        print(f"\n   ❌ Aucun résultat pour les requêtes de test")
    
    # 6. Résumé et recommandations
    print_section("📋 RÉSUMÉ ET RECOMMANDATIONS")
    
    print("\n✅ RÉSUMÉ DES TROUVAILLES:")
    print(f"   • Documents en BD: {len(documents) if 'documents' in locals() else '?'}")
    print(f"   • Chunks indexés: {total_chunks}")
    print(f"   • Fichiers physiques trouvés: {len(list(storage_path.glob('*'))) if storage_path.exists() else 0}")
    
    print("\n⚠️  PROBLÈMES IDENTIFIÉS:")
    
    if total_chunks == 0 and documents:
        print("   1. ❌ Documents en BD mais AUCUN chunk indexé!")
        print("   2. ❌ Les documents ne sont pas vectorisés")
        print("   3. ❌ Problème lors de l'appel à indexer.index_document()")
    
    if documents and any(not os.path.exists(d.file_path or "") for d in documents):
        print("   • ❌ Chemin de fichier incorrect dans la configuration")
        print(f"   • Utilisé: {hf_parent / 'documents'}")
        print(f"   • Correct: /app/storage/documents")
    
    print("\n💡 ACTIONS RECOMMANDÉES:")
    
    if total_chunks == 0 and documents:
        print("   1. Vérifier pourquoi l'indexation n'a pas fonctionné")
        print("   2. Exécuter: python scripts/reindex_documents.py")
        print("   3. Vérifier les chemins dans document_service.py")
    
    if documents and any(not os.path.exists(d.file_path or "") for d in documents):
        print("   1. URGENT: Corriger le chemin de stockage dans document_service.py ligne 76")
        print("   2. Modifier: upload_dir = Path(settings.STORAGE_DIR) / 'documents'")
        print("   3. Ajouter à settings.py: STORAGE_DIR = '/app/storage'")
        print("   4. Réindexer tous les documents")
    
    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(diagnose_upload_flow())
