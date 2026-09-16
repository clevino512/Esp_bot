from typing import Any
import asyncio
import logging
import os
import tempfile
import time
import wave
import io

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SUPPORTED_WHISPER_MODELS = {"tiny", "base", "medium"}


class ASREngine:
    """Moteur ASR UniBot : Whisper pour le PFE, Vosk conservé pour le mode hors-ligne."""

    _whisper_models: dict[str, Any] = {}
    _vosk_model = None

    def __init__(self, mode: str | None = None, language: str | None = None, model_name: str | None = None):
        self.mode = mode or settings.ASR_MODE
        self.language = language or settings.WHISPER_LANGUAGE
        self.model_name = model_name or settings.WHISPER_MODEL
        if self.mode == "whisper" and self.model_name not in SUPPORTED_WHISPER_MODELS:
            raise ValueError(f"Whisper model must be one of: {', '.join(sorted(SUPPORTED_WHISPER_MODELS))}")

    def load_whisper(self):
        if self.model_name not in self._whisper_models:
            import whisper
            logger.info("Loading Whisper model %s on %s", self.model_name, settings.WHISPER_DEVICE)
            self._whisper_models[self.model_name] = whisper.load_model(
                self.model_name,
                device=settings.WHISPER_DEVICE,
            )
        return self._whisper_models[self.model_name]

    def load_vosk(self):
        if ASREngine._vosk_model is None:
            from vosk import Model
            logger.info("Loading Vosk model from %s", settings.VOSK_MODEL_PATH)
            ASREngine._vosk_model = Model(settings.VOSK_MODEL_PATH)
        return ASREngine._vosk_model

    async def transcribe(self, audio_data: bytes, suffix: str = ".wav") -> dict[str, Any]:
        started = time.perf_counter()
        if self.mode == "whisper":
            result = await self._transcribe_whisper(audio_data, suffix)
        else:
            result = await self._transcribe_vosk(audio_data)
        result["processing_time_ms"] = round((time.perf_counter() - started) * 1000, 2)
        result["engine"] = self.mode
        result["model"] = self.model_name if self.mode == "whisper" else "vosk"
        duration = result.get("duration_seconds", 0.0)
        result["real_time_factor"] = round((result["processing_time_ms"] / 1000) / duration, 4) if duration else None
        return result

    async def _transcribe_whisper(self, audio_data: bytes, suffix: str) -> dict[str, Any]:
        model = self.load_whisper()
        suffix = suffix if suffix.startswith(".") else f".{suffix}"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name

        try:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                None,
                lambda: model.transcribe(
                    tmp_path,
                    language=self.language,
                    task="transcribe",
                    fp16=settings.WHISPER_DEVICE != "cpu",
                ),
            )
            text = result.get("text", "").strip()
            segments = result.get("segments", [])
            duration = max((float(s.get("end", 0)) for s in segments), default=0.0)
            return {
                "text": text,
                "language": result.get("language", self.language),
                "duration_seconds": round(duration, 3),
                "confidence": self._calculate_confidence(segments),
            }
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                logger.warning("Unable to remove temporary ASR file %s", tmp_path)

    async def _transcribe_vosk(self, audio_data: bytes) -> dict[str, Any]:
        from vosk import KaldiRecognizer
        import json

        model = self.load_vosk()
        audio = io.BytesIO(audio_data)
        with wave.open(audio, "rb") as wf:
            sample_rate = wf.getframerate()
            duration = wf.getnframes() / sample_rate
            recognizer = KaldiRecognizer(model, sample_rate)
            recognizer.SetWords(True)
            results = []
            while True:
                data = wf.readframes(4000)
                if not data:
                    break
                if recognizer.AcceptWaveform(data):
                    results.append(json.loads(recognizer.Result()))
            results.append(json.loads(recognizer.FinalResult()))

        return {
            "text": " ".join(r.get("text", "") for r in results).strip(),
            "language": "fr",
            "duration_seconds": round(duration, 3),
            "confidence": self._calculate_vosk_confidence(results),
        }

    @staticmethod
    def _calculate_confidence(segments: list[dict]) -> float:
        logprobs = [float(s["avg_logprob"]) for s in segments if "avg_logprob" in s]
        if not logprobs:
            return 0.0
        avg = sum(logprobs) / len(logprobs)
        return round(max(0.0, min(1.0, avg + 1.0)), 4)

    @staticmethod
    def _calculate_vosk_confidence(results: list[dict]) -> float:
        values = [float(word["conf"]) for r in results for word in r.get("result", []) if "conf" in word]
        return round(sum(values) / len(values), 4) if values else 0.0


async def transcribe_audio(audio_data: bytes, model_name: str | None = None, suffix: str = ".wav") -> dict[str, Any]:
    return await ASREngine(model_name=model_name).transcribe(audio_data, suffix=suffix)
