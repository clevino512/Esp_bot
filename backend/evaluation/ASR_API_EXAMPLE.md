# API ASR PFE

Endpoint : `POST /voice/transcribe`

Form-data :
- `audio` : fichier WAV, MP3, M4A, OGG, WEBM ou FLAC (10 Mo maximum)
- `language` : `fr`
- `model` : `tiny`, `base` ou `medium`

La réponse contient la transcription et les informations expérimentales utiles : `duration_seconds`, `confidence`, `processing_time_ms`, `real_time_factor`, `engine` et `model`.

Ces métadonnées permettent de tester les trois modèles depuis l'API sans modifier le code entre deux essais.
