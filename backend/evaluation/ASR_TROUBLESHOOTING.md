# Dépannage ASR

- `No module named whisper` : réinstaller `requirements.txt` dans l'environnement Python actif.
- `ffmpeg not found` : installer FFmpeg et vérifier qu'il est présent dans le PATH Windows.
- Premier lancement très long : Whisper télécharge le modèle lors du premier chargement.
- `medium` lent ou mémoire insuffisante : conserver le résultat comme contrainte expérimentale et comparer avec tiny/base ; ne pas modifier les chiffres.
- Format audio rejeté : utiliser WAV, MP3, M4A, OGG, WEBM ou FLAC et rester sous 10 Mo.
- Résultat JSON absent : vérifier les chemins de `evaluation/asr_corpus.csv` et l'existence des fichiers audio.
