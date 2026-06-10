from typing import Any
import logging
import tempfile
import os
import wave
import io

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class ASREngine:
    def __init__(
        self,
        mode: str | None = None,
        language: str | None = None,
    ):
        self.mode = mode or settings.ASR_MODE
        self.language = language or settings.WHISPER_LANGUAGE
        self._whisper_model = None
        self._vosk_model = None

    def load_whisper(self):
        if self._whisper_model is None:
            import whisper
            logger.info(f"Loading Whisper model: {settings.WHISPER_MODEL}")
            self._whisper_model = whisper.load_model(
                settings.WHISPER_MODEL,
                device=settings.WHISPER_DEVICE,
            )
        return self._whisper_model

    def load_vosk(self):
        if self._vosk_model is None:
            from vosk import Model
            logger.info(f"Loading Vosk model from: {settings.VOSK_MODEL_PATH}")
            self._vosk_model = Model(settings.VOSK_MODEL_PATH)
        return self._vosk_model

    async def transcribe(self, audio_data: bytes) -> dict[str, Any]:
        if self.mode == "whisper":
            return await self._transcribe_whisper(audio_data)
        else:
            return await self._transcribe_vosk(audio_data)

    async def _transcribe_whisper(self, audio_data: bytes) -> dict[str, Any]:
        import asyncio
        model = self.load_whisper()

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name

        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: model.transcribe(tmp_path, language=self.language)
            )

            text = result.get("text", "").strip()
            segments = result.get("segments", [])
            duration = sum(s.get("end", 0) - s.get("start", 0) for s in segments)
            confidence = self._calculate_confidence(segments)

            return {
                "text": text,
                "language": self.language,
                "duration_seconds": duration,
                "confidence": confidence,
            }
        finally:
            os.unlink(tmp_path)

    async def _transcribe_vosk(self, audio_data: bytes) -> dict[str, Any]:
        from vosk import KaldiRecognizer
        import json

        model = self.load_vosk()
        recognizer = KaldiRecognizer(model, settings.VOSK_SAMPLE_RATE)

        audio = io.BytesIO(audio_data)
        with wave.open(audio, "rb") as wf:
            sample_rate = wf.getframerate()
            duration = wf.getnframes() / sample_rate

            results = []
            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                if recognizer.AcceptWaveform(data):
                    results.append(json.loads(recognizer.Result()))

            final_result = json.loads(recognizer.FinalResult())
            results.append(final_result)

        text = " ".join(r.get("text", "") for r in results).strip()
        confidence = self._calculate_vosk_confidence(results)

        return {
            "text": text,
            "language": "fr",
            "duration_seconds": duration,
            "confidence": confidence,
        }

    def _calculate_confidence(self, segments: list[dict]) -> float:
        if not segments:
            return 0.0
        confidences = [s.get("avg_logprob", -1.0) for s in segments if "avg_logprob" in s]
        if not confidences:
            return 0.5
        avg_logprob = sum(confidences) / len(confidences)
        return max(0.0, min(1.0, (avg_logprob + 1.0)))

    def _calculate_vosk_confidence(self, results: list[dict]) -> float:
        confidences = []
        for r in results:
            if "result" in r and isinstance(r["result"], list):
                for word in r["result"]:
                    if "conf" in word:
                        confidences.append(word["conf"])
        if not confidences:
            return 0.5
        return sum(confidences) / len(confidences)


async def transcribe_audio(audio_data: bytes) -> dict[str, Any]:
    engine = ASREngine()
    return await engine.transcribe(audio_data)
