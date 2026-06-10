#!/usr/bin/env python3
"""
RAG Evaluation Script for UniBot ESPA

This script evaluates the RAG pipeline performance using test queries.

Usage:
    python evaluate_rag.py --questions questions.json --output results.json
"""

import argparse
import asyncio
import json
import logging
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.retriever import Retriever
from app.core.llm_client import LLMClient
from app.core.fallback import FallbackHandler
from app.core.prompts import PromptTemplates

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def evaluate_single(
    question: str,
    expected_answer: str | None = None,
    retriever: Retriever = None,
    llm: LLMClient = None,
):
    """Evaluate a single question."""

    start_time = time.time()

    sources = await retriever.aretrieve(question)

    retrieval_time = time.time() - start_time

    fallback = FallbackHandler()
    is_fallback = fallback.should_fallback(sources)

    if sources and not is_fallback:
        context = "\n\n".join(s.get("content", "") for s in sources[:3])
        prompt = PromptTemplates.format_rag_prompt(question=question, context=context)
        response = await llm.generate(
            system_prompt=PromptTemplates.SYSTEM_PROMPT,
            user_prompt=prompt,
        )
    else:
        prompt = PromptTemplates.format_fallback_prompt(question)
        response = await llm.generate(
            system_prompt=PromptTemplates.SYSTEM_PROMPT,
            user_prompt=prompt,
        )

    total_time = time.time() - start_time

    max_relevance = max(s.get("relevance_score", 0) for s in sources) if sources else 0
    avg_relevance = sum(s.get("relevance_score", 0) for s in sources) / len(sources) if sources else 0

    return {
        "question": question,
        "response": response,
        "num_sources": len(sources),
        "max_relevance": max_relevance,
        "avg_relevance": avg_relevance,
        "is_fallback": is_fallback,
        "retrieval_time_ms": round(retrieval_time * 1000, 2),
        "total_time_ms": round(total_time * 1000, 2),
        "sources": [
            {
                "content": s.get("content", "")[:200],
                "relevance": s.get("relevance_score", 0),
                "metadata": s.get("metadata", {}),
            }
            for s in sources[:3]
        ],
    }


async def evaluate_questions(questions_file: str, output_file: str):
    """Evaluate all questions from a JSON file."""

    with open(questions_file, "r", encoding="utf-8") as f:
        questions = json.load(f)

    retriever = Retriever()
    llm = LLMClient()

    results = []

    for i, q in enumerate(questions):
        question_text = q.get("question") or q.get("text", "")
        expected = q.get("expected_answer") or q.get("answer")

        logger.info(f"Evaluating question {i+1}/{len(questions)}: {question_text[:50]}...")

        result = await evaluate_single(
            question=question_text,
            expected_answer=expected,
            retriever=retriever,
            llm=llm,
        )
        results.append(result)

    total_fallbacks = sum(1 for r in results if r["is_fallback"])
    avg_relevance = sum(r["max_relevance"] for r in results) / len(results)
    avg_time = sum(r["total_time_ms"] for r in results) / len(results)

    summary = {
        "total_questions": len(questions),
        "total_fallbacks": total_fallbacks,
        "fallback_rate": round(total_fallbacks / len(questions), 3),
        "avg_max_relevance": round(avg_relevance, 3),
        "avg_response_time_ms": round(avg_time, 2),
        "results": results,
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    logger.info(f"Evaluation complete. Results saved to {output_file}")
    print(f"\nSummary:")
    print(f"  Total questions: {len(questions)}")
    print(f"  Fallback rate: {summary['fallback_rate']:.1%}")
    print(f"  Average relevance: {avg_relevance:.2%}")
    print(f"  Average response time: {avg_time:.0f}ms")


def main():
    parser = argparse.ArgumentParser(description="Evaluate RAG pipeline")
    parser.add_argument(
        "--questions",
        type=str,
        required=True,
        help="JSON file containing test questions",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="evaluation_results.json",
        help="Output file for results",
    )

    args = parser.parse_args()

    asyncio.run(evaluate_questions(args.questions, args.output))


if __name__ == "__main__":
    main()
