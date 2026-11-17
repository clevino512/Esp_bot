"""Validation helpers for browser-recorded and uploaded audio."""

from pathlib import Path


MAX_AUDIO_BYTES = 10 * 1024 * 1024

AUDIO_MIME_TYPES = {
    ".mp3": {"audio/mpeg", "audio/mp3", "audio/x-mpeg"},
    ".wav": {"audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave"},
    ".webm": {"audio/webm"},
    ".ogg": {"audio/ogg", "audio/opus"},
    ".m4a": {"audio/mp4", "audio/m4a", "audio/x-m4a"},
}


class AudioUploadError(ValueError):
    def __init__(self, detail: str, status_code: int = 400):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def validate_audio_upload(filename: str | None, content_type: str | None, data: bytes) -> str:
    """Validate extension, declared audio MIME type, size, and file signature."""
    suffix = Path(filename or "").suffix.lower()
    if suffix not in AUDIO_MIME_TYPES:
        raise AudioUploadError("Format audio non pris en charge. Utilisez MP3, WAV, WebM, OGG ou M4A.", 415)

    mime_type = (content_type or "").split(";", 1)[0].strip().lower()
    if mime_type not in AUDIO_MIME_TYPES[suffix]:
        raise AudioUploadError("Le type MIME ne correspond pas à un fichier audio pris en charge.", 415)

    if not data:
        raise AudioUploadError("Le fichier audio est vide.")
    if len(data) > MAX_AUDIO_BYTES:
        raise AudioUploadError("Le fichier audio dépasse la limite de 10 Mo.", 413)
    if not _matches_audio_signature(suffix, data):
        raise AudioUploadError("Le contenu du fichier ne correspond pas au format audio annoncé.")

    return suffix


def _matches_audio_signature(suffix: str, data: bytes) -> bool:
    if suffix == ".wav":
        return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WAVE"
    if suffix == ".mp3":
        return data.startswith(b"ID3") or (
            len(data) >= 2 and data[0] == 0xFF and data[1] & 0xE0 == 0xE0
        )
    if suffix == ".webm":
        return data.startswith(b"\x1a\x45\xdf\xa3")
    if suffix == ".ogg":
        return data.startswith(b"OggS")
    if suffix == ".m4a":
        return len(data) >= 8 and data[4:8] == b"ftyp"
    return False
