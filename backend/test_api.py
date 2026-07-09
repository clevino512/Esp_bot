# import asyncio
# import chromadb


# async def inspect_content() -> None:
#     client = chromadb.HttpClient(host="localhost", port=8001)
#     collection = client.get_collection("espa_knowledge_base")

#     result = collection.get(
#         where={"document_id": 2},
#         include=["documents", "metadatas"],
#         limit=3,
#     )

#     print("📄 Contenu textuel réel des 3 premiers chunks :\n")
#     for i, content in enumerate(result["documents"]):
#         print(f"--- Chunk {i} ---")
#         print(content[:300])
#         print()


# if __name__ == "__main__":
#     asyncio.run(inspect_content())


#     ------------------------------------

# check_metric.py
# import asyncio
# import chromadb
# import asyncio
# from app.core.embedder import Embedder
# from app.config import get_settings
# import chromadb
# from chromadb.config import Settings as ChromaSettings


# async def check_metric() -> None:
#     client = chromadb.HttpClient(host="localhost", port=8001)
#     collection = client.get_collection("espa_knowledge_base")
#     print("Métadonnées de la collection :", collection.metadata)

# asyncio.run(check_metric())


# # audit_retriever.py
# """
# Audit ciblé du pipeline de retrieval — isole la cause exacte du filtrage à zéro résultat.
# Usage : py audit_retriever.py
# """

# settings = get_settings()


# async def audit() -> None:
#     print("=== Configuration active ===")
#     print(f"CHROMA_COLLECTION_NAME : {settings.CHROMA_COLLECTION_NAME}")
#     print(f"CHROMA_DISTANCE_FUNCTION : {settings.CHROMA_DISTANCE_FUNCTION}")
#     print(f"MIN_RELEVANCE_SCORE : {settings.MIN_RELEVANCE_SCORE}")
#     print(f"TOP_K_RETRIEVAL : {settings.TOP_K_RETRIEVAL}")
#     print()

#     client = chromadb.HttpClient(
#         host=settings.CHROMA_HOST,
#         port=settings.CHROMA_PORT,
#         settings=ChromaSettings(anonymized_telemetry=False),
#     )
#     collection = client.get_collection(settings.CHROMA_COLLECTION_NAME)
#     print(f"=== Métadonnées de la collection (métrique HNSW réelle) ===")
#     print(collection.metadata)
#     print()

#     embedder = Embedder()
#     query = "Quels sont les règlements de l'ESPA?"
#     query_embedding = embedder.embed_single(query)

#     results = collection.query(
#         query_embeddings=[query_embedding],
#         n_results=settings.TOP_K_RETRIEVAL,
#         include=["documents", "metadatas", "distances"],
#     )

#     print("=== Résultats bruts (avant filtrage min_relevance) ===\n")
#     for i, doc_id in enumerate(results["ids"][0]):
#         distance = results["distances"][0][i]
#         relevance = 1 - distance
#         status = "✅ ACCEPTÉ" if relevance >= settings.MIN_RELEVANCE_SCORE else "❌ REJETÉ"
#         print(f"[{i}] id={doc_id}")
#         print(f"    distance={distance:.4f} → relevance={relevance:.4f}  [{status}]")
#         print(f"    filename={results['metadatas'][0][i].get('filename')}")
#         print()


# if __name__ == "__main__":
#     asyncio.run(audit())

    # calibrate_threshold.py
"""
Teste plusieurs seuils de pertinence sur un panel de questions représentatives.
Usage : py calibrate_threshold.py
"""


import asyncio
from app.core.retriever import Retriever

TEST_QUERIES = [
    "Quels sont les règlements de l'ESPA?",
    "Quels sont mes droits en tant qu'étudiant?",
    "Comment se déroulent les examens?",
    "Puis-je m'exprimer librement à l'ESPA?",
]

CANDIDATE_THRESHOLDS = [0.65, 0.55, 0.45, 0.35]


async def calibrate() -> None:
    for threshold in CANDIDATE_THRESHOLDS:
        print(f"\n{'='*60}")
        print(f"SEUIL TESTÉ : {threshold}")
        print('='*60)
        retriever = Retriever(min_relevance=threshold)

        for query in TEST_QUERIES:
            results = await retriever.aretrieve(query)
            print(f"\n  Q: {query}")
            print(f"  → {len(results)} source(s) trouvée(s)")
            if results:
                top = results[0]
                print(f"    Top score: {top['relevance_score']:.4f} — {top['metadata'].get('filename')}")


if __name__ == "__main__":
    asyncio.run(calibrate())