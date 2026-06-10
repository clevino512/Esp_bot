from typing import Any
import logging
import tempfile
import os
import io

from pydub import AudioSegment

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class TTSEngine:
    def __init__(
        self,
        engine: str | None = None,
        language: str | None = None,
    ):
        self.engine = engine or settings.TTS_ENGINE
        self.language = language or settings.TTS_LANGUAGE
        self._coqui_tts = None

    def load_coqui(self):
        if self._coqui_tts is None:
            from TTS.api import TTS
            logger.info("Loading Coqui TTS model")
            self._coqui_tts = TTS(
                model_name="tts_models/fr/css10/vits",
                progress_bar=False,
                gpu=settings.EMBEDDING_DEVICE != "cpu",
            )
        return self._coqui_tts

    async def synthesize(self, text: str) -> bytes:
        if self.engine == "gtts":
            return await self._synthesize_gtts(text)
        else:
            return await self._synthesize_coqui(text)

    async def _synthesize_gtts(self, text: str) -> bytes:
        from gtts import gTTS

        mp3_buffer = io.BytesIO()
        tts = gTTS(text=text, lang=self.language, slow=False)
        tts.write_to_fp(mp3_buffer)
        mp3_buffer.seek(0)

        audio = AudioSegment.from_mp3(mp3_buffer)
        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        wav_buffer.seek(0)

        return wav_buffer.read()

    async def _synthesize_coqui(self, text: str) -> bytes:
        import asyncio

        tts = self.load_coqui()

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: tts.tts_to_file(text=text, file_path=tmp_path)
            )

            with open(tmp_path, "rb") as f:
                audio_data = f.read()

            return audio_data
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    def get_supported_languages(self) -> list[str]:
        if self.engine == "gtts":
            return ["fr", "en", "mg"]
        return ["fr", "en"]

    async def synthesize_to_file(self, text: str, output_path: str) -> str:
        audio_data = await self.synthesize(text)
        with open(output_path, "wb") as f:
            f.write(audio_data)
        return output_path


async def synthesize_speech(text: str) -> bytes:
    engine = TTSEngine()
    return await engine.synthesize(text)
