"""Benchmark PFE des modèles Whisper tiny/base/medium.

Corpus CSV attendu : audio_path,reference
Exemple : data/asr_test/01.wav,"Comment obtenir mon relevé de notes ?"

Usage depuis backend/ :
    python scripts/evaluate_asr.py --dataset data/asr_test/corpus.csv
"""
import argparse
import asyncio
import csv
import json
from pathlib import Path
from statistics import mean

from app.voice.asr import ASREngine
from app.voice.metrics import word_error_rate

MODELS = ("tiny", "base", "medium")


async def evaluate_model(model_name: str, rows: list[dict], dataset_dir: Path) -> dict:
    engine = ASREngine(mode="whisper", language="fr", model_name=model_name)
    samples = []

    for row in rows:
        audio_path = (dataset_dir / row["audio_path"]).resolve()
        if not audio_path.is_file():
            raise FileNotFoundError(f"Audio introuvable: {audio_path}")

        result = await engine.transcribe(audio_path.read_bytes(), suffix=audio_path.suffix)
        wer = word_error_rate(row["reference"], result["text"])
        samples.append({
            "audio": row["audio_path"],
            "reference": row["reference"],
            "hypothesis": result["text"],
            "wer": round(wer, 4),
            "processing_time_ms": result["processing_time_ms"],
            "duration_seconds": result["duration_seconds"],
            "real_time_factor": result["real_time_factor"],
        })

    return {
        "model": model_name,
        "sample_count": len(samples),
        "mean_wer": round(mean(s["wer"] for s in samples), 4) if samples else None,
        "mean_processing_time_ms": round(mean(s["processing_time_ms"] for s in samples), 2) if samples else None,
        "mean_real_time_factor": round(mean(s["real_time_factor"] for s in samples if s["real_time_factor"] is not None), 4) if any(s["real_time_factor"] is not None for s in samples) else None,
        "samples": samples,
    }


async def main(dataset: Path, output: Path) -> None:
    with dataset.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows or not {"audio_path", "reference"}.issubset(rows[0]):
        raise ValueError("Le CSV doit contenir les colonnes audio_path et reference")

    results = []
    for model in MODELS:
        print(f"Evaluation Whisper {model}...")
        results.append(await evaluate_model(model, rows, dataset.parent))

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"models": results}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Résultats enregistrés dans {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Benchmark Whisper du PFE UniBot ESPA")
    parser.add_argument("--dataset", type=Path, required=True, help="CSV audio_path,reference")
    parser.add_argument("--output", type=Path, default=Path("evaluation/results/asr_benchmark.json"))
    args = parser.parse_args()
    asyncio.run(main(args.dataset, args.output))
