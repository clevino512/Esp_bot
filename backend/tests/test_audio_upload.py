import pytest

from app.voice.upload import AudioUploadError, MAX_AUDIO_BYTES, validate_audio_upload


@pytest.mark.parametrize(
    ("filename", "content_type", "payload"),
    [
        ("recording.wav", "audio/wav", b"RIFF\x00\x00\x00\x00WAVEdata"),
        ("recording.mp3", "audio/mpeg", b"ID3\x04\x00\x00"),
        ("recording.webm", "audio/webm;codecs=opus", b"\x1a\x45\xdf\xa3webm"),
        ("recording.ogg", "audio/ogg", b"OggS\x00audio"),
        ("recording.m4a", "audio/mp4", b"\x00\x00\x00\x18ftypM4A "),
    ],
)
def test_accepts_supported_audio(filename, content_type, payload):
    suffix = validate_audio_upload(filename, content_type, payload)
    assert suffix == "." + filename.rsplit(".", 1)[1]


def test_rejects_non_audio_extension():
    with pytest.raises(AudioUploadError, match="Format audio"):
        validate_audio_upload("document.pdf", "application/pdf", b"%PDF")


def test_rejects_mismatched_mime_type():
    with pytest.raises(AudioUploadError, match="type MIME"):
        validate_audio_upload("recording.wav", "audio/mpeg", b"RIFF\x00\x00\x00\x00WAVEdata")


def test_rejects_invalid_file_signature():
    with pytest.raises(AudioUploadError, match="contenu du fichier"):
        validate_audio_upload("recording.wav", "audio/wav", b"not really audio")


def test_rejects_empty_audio():
    with pytest.raises(AudioUploadError, match="vide"):
        validate_audio_upload("recording.wav", "audio/wav", b"")


def test_rejects_oversized_audio():
    with pytest.raises(AudioUploadError) as error:
        validate_audio_upload(
            "recording.wav",
            "audio/wav",
            b"RIFF\x00\x00\x00\x00WAVE" + b"\x00" * MAX_AUDIO_BYTES,
        )
    assert error.value.status_code == 413
