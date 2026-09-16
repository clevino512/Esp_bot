# Test rapide sous Windows

Depuis le dépôt local :

```bat
git fetch origin
git switch pfe-whisper-asr
git pull origin pfe-whisper-asr
cd backend
pip install -r requirements.txt
```

FFmpeg doit être installé et accessible avec `ffmpeg -version`.

## Tests unitaires

Double-cliquer `evaluation\run_asr_tests.bat` ou lancer :

```bat
pytest tests\test_asr_metrics.py tests\test_asr_engine.py tests\test_voice_response.py -v
```

## Benchmark réel

Placer les WAV/MP3/etc. dans `data\asr_test`, mettre à jour `evaluation\asr_corpus.csv`, puis lancer :

```bat
evaluation\run_asr_benchmark.bat
```

Le fichier `evaluation\results\asr_benchmark.json` contiendra les mesures réelles tiny/base/medium.
