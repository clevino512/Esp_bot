# ASR Quick Start

1. `git switch pfe-whisper-asr`
2. `cd backend`
3. Installer les dépendances et FFmpeg.
4. Lancer `evaluation/run_asr_tests.bat`.
5. Tester `/voice/transcribe` dans Swagger avec un petit audio français.
6. Enregistrer les vrais audios dans `data/asr_test`.
7. Mettre à jour `evaluation/asr_corpus.csv`.
8. Lancer `evaluation/run_asr_benchmark.bat`.
9. Envoyer le JSON obtenu pour analyse des résultats tiny/base/medium.
