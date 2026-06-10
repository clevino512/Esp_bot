#!/usr/bin/env python3
"""
Document Ingestion Script for UniBot ESPA

This script loads documents from a directory and ingests them into the
knowledge base for RAG retrieval.

Usage:
    python ingest_documents.py --dir /path/to/documents [--category general]
"""

import argparse
import asyncio
import logging
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import get_settings
from app.knowledge.loader import DocumentLoader
from app.knowledge.preprocessor import TextPreprocessor
from app.knowledge.indexer import KnowledgeIndexer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()


async def ingest_directory(
    directory: str,
    category: str = "general",
    batch_size: int = 10,
):
    """Ingest all documents from a directory into the knowledge base."""

    indexer = KnowledgeIndexer()
    loader = DocumentLoader()

    path = Path(directory)
    if not path.is_dir():
        logger.error(f"Directory not found: {directory}")
        return

    supported_extensions = {".pdf", ".docx", ".txt", ".md", ".html"}
    documents = []

    for file_path in path.rglob("*"):
        if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
            try:
                doc_data = loader.load(str(file_path))
                doc_data["filepath"] = str(file_path)
                doc_data["filename"] = file_path.name
                documents.append(doc_data)
                logger.info(f"Loaded: {file_path.name}")
            except Exception as e:
                logger.error(f"Failed to load {file_path}: {e}")

    if not documents:
        logger.warning("No documents found to ingest")
        return

    logger.info(f"Found {len(documents)} documents to ingest")

    document_id = 1
    for i, doc in enumerate(documents):
        try:
            chunk_count = await indexer.index_document(
                document_id=document_id,
                title=doc.get("metadata", {}).get("filename", f"Document {document_id}"),
                content=doc.get("content", ""),
                category=category,
                filename=doc.get("filename"),
            )
            logger.info(f"Ingested document {document_id}: {chunk_count} chunks")
            document_id += 1
        except Exception as e:
            logger.error(f"Failed to ingest document {i+1}: {e}")

    logger.info(f"Ingestion complete. Total documents: {document_id - 1}")


async def test_retrieval(query: str):
    """Test retrieval with a sample query."""

    from app.core.retriever import Retriever

    retriever = Retriever()
    results = await retriever.aretrieve(query)

    print(f"\nQuery: {query}")
    print(f"Found {len(results)} results:")
    for i, r in enumerate(results):
        print(f"\n[{i+1}] Relevance: {r['relevance_score']:.2%}")
        print(f"Content: {r['content'][:200]}...")


def main():
    parser = argparse.ArgumentParser(description="Ingest documents into knowledge base")
    parser.add_argument(
        "--dir",
        type=str,
        required=True,
        help="Directory containing documents to ingest",
    )
    parser.add_argument(
        "--category",
        type=str,
        default="general",
        choices=["admission", "inscription", "examens", "notes", "boursers", "stages", "diplomes", "general"],
        help="Category for documents",
    )
    parser.add_argument(
        "--test",
        type=str,
        help="Test query after ingestion",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help="Batch size for processing",
    )

    args = parser.parse_args()

    asyncio.run(ingest_directory(
        directory=args.dir,
        category=args.category,
        batch_size=args.batch_size,
    ))

    if args.test:
        asyncio.run(test_retrieval(args.test))


if __name__ == "__main__":
    main()
