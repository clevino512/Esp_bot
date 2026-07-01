#!/usr/bin/env python3
"""
SCRIPT DE DIAGNOSTIC - Vérifier l'indexation des documents
Utile pour déboguer pourquoi les documents ne sont pas retrouvés
"""

import asyncio
import logging
from pathlib import Path

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Ajouter le chemin du backend au sys.path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.retriever import Retriever
from app.core.embedder import Embedder
from app.config import get_settings

settings = get_settings()


def print_separator(title=""):
    print("\n" + "="*80)
    if title:
        print(f"  {title}")
        print("="*80)


async def diagnose():
    print_separator("DIAGNOSTIC D'INDEXATION DES DOCUMENTS")
    
    # 1. Vérifier la connexion à ChromaDB
    print("\n1️⃣  VÉRIFICATION DE LA CONNEXION CHROMADB")
    print("-" * 80)
    retriever = Retriever()
    try:
        count = retriever.count()
        print(f"✅ Connexion ChromaDB OK")
        print(f"📊 Total de chunks indexés: {count}")
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return

    # 2. Tester les requêtes de diagnostic
    print("\n2️⃣  TEST DE REQUÊTES DIAGNOSTIC")
    print("-" * 80)
    
    test_queries = [
        "relevé de notes procedure",
        "rentrée des étudiants 2024",
        "demande relevé note",
        "examen date",
        "bourses ESPA",
        "inscription étudiant",
    ]
    
    embedder = Embedder()
    
    for query in test_queries:
        print(f"\n📌 Query: '{query}'")
        sources = retriever.retrieve(query)
        
        if not sources:
            print("   ⚠️  AUCUN RÉSULTAT - Vérifier l'indexation")
        else:
            print(f"   ✅ {len(sources)} sources trouvées:")
            for i, source in enumerate(sources, 1):
                metadata = source.get("metadata", {})
                relevance = source.get("relevance_score", 0)
                title = metadata.get("title", "Sans titre")
                print(f"      {i}. [{relevance:.2%}] {title}")
                print(f"         Snippet: {source.get('content', '')[:100]}...")

    # 3. Analyser la distribution des scores
    print("\n3️⃣  ANALYSE DE LA DISTRIBUTION DES SCORES")
    print("-" * 80)
    
    all_scores = []
    for query in test_queries:
        sources = retriever.retrieve(query)
        for source in sources:
            all_scores.append(source.get("relevance_score", 0))
    
    if all_scores:
        min_score = min(all_scores)
        max_score = max(all_scores)
        avg_score = sum(all_scores) / len(all_scores)
        
        print(f"📊 Statistiques des scores de pertinence:")
        print(f"   Min: {min_score:.3f}")
        print(f"   Max: {max_score:.3f}")
        print(f"   Moyenne: {avg_score:.3f}")
        print(f"   Configuration MIN_RELEVANCE_SCORE: {settings.MIN_RELEVANCE_SCORE}")
        
        filtered_count = sum(1 for s in all_scores if s >= settings.MIN_RELEVANCE_SCORE)
        print(f"   Scores >= {settings.MIN_RELEVANCE_SCORE}: {filtered_count}/{len(all_scores)}")
        
        if filtered_count < len(all_scores) * 0.5:
            print(f"   ⚠️  ALERTE: Beaucoup de documents sont filtrés!")
    
    # 4. Recommandations
    print("\n4️⃣  RECOMMANDATIONS")
    print("-" * 80)
    
    if count == 0:
        print("❌ Pas de documents indexés!")
        print("   → Vérifier que les documents ont été uploadés via l'admin")
        print("   → Vérifier les logs du backend lors de l'upload")
    elif count < 10:
        print("⚠️  Très peu de documents indexés")
        print("   → Indexer plus de documents pour améliorer la pertinence")
    else:
        print("✅ Nombre de documents correct")
        
        if min_score > 0.8:
            print("⚠️  Les scores sont très élevés - risque de sur-spécialisation")
        elif max_score < 0.5:
            print("⚠️  Les scores sont bas - vérifier la qualité de l'embedding")
    
    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(diagnose())
