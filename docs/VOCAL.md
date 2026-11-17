# Module vocal UniBot ESPA

## Causes des problèmes

1. **Lecture des réponses** — chaque réponse utilisait une fonction qui lançait une requête TTS puis un élément audio temporaire. Le bouton ne proposait ni pause, ni reprise, ni arrêt, et plusieurs réponses pouvaient démarrer une lecture simultanément. Le backend importait aussi `pydub`, qui n’était pas déclaré dans les dépendances, pour convertir le MP3 gTTS en WAV.
2. **Enregistrement direct** — à l’arrêt du microphone, le hook transcrivait immédiatement le blob puis envoyait uniquement le texte à `/chat/message`. Il n’y avait donc ni aperçu réécoutable, ni envoi du véritable audio au parcours `/voice/chat`.
3. **Import audio** — la barre de chat ne contenait aucune entrée de fichier. Côté backend, les extensions étaient contrôlées mais le fichier était entièrement lu avant la vérification de taille ; le type MIME et la signature réelle n’étaient pas validés.
4. **Contexte du chat vocal** — le point d’accès `/voice/chat` existait, mais le frontend ne l’appelait pas et ne transmettait pas l’historique de conversation.
5. **Envoi des fichiers** — l’instance Axios du frontend avait `application/json` comme type de contenu par défaut. Sans configuration multipart explicite, un objet `FormData` pouvait être transformé en JSON au lieu d’être reçu comme un upload par FastAPI.

## Corrections apportées

- `frontend/src/services/voicePlayback.ts` utilise la Web Speech API en français, partage un seul lecteur entre les réponses, et expose les états lecture, pause, reprise et arrêt.
- `frontend/src/components/chat/MessageBubble.tsx` présente les commandes de lecture pour chaque réponse ; le lecteur est arrêté quand son message disparaît.
- `frontend/src/hooks/useVoiceRecorder.ts` gère les permissions, le format d’enregistrement disponible dans le navigateur, la durée maximale de 60 secondes, l’annulation et la fermeture des pistes du microphone.
- `frontend/src/components/chat/InputBar.tsx` permet l’aperçu, la réécoute, le retrait et l’envoi d’un enregistrement ou d’un fichier audio.
- `frontend/src/services/voiceService.ts` force l’envoi multipart pour les requêtes vocales, limite les imports aux fichiers MP3, WAV, WebM, OGG et M4A de 10 Mo maximum et normalise la réponse de `/voice/chat`.
- `frontend/src/hooks/useChat.ts` envoie le vrai audio à `/voice/chat`, ajoute la transcription au fil de discussion, conserve la vérification des demandes de relevé de notes et restaure le mode vocal dans l’historique.
- `backend/app/voice/upload.py` vérifie l’extension, le MIME, la taille et la signature du contenu. `backend/app/routes/voice_router.py` lit au plus 10 Mo + 1 octet, ferme l’upload, valide l’historique et renvoie des erreurs explicites.
- `backend/app/voice/asr.py` supprime ses fichiers temporaires après transcription et convertit les formats acceptés en WAV PCM temporaire pour Vosk.
- `backend/app/voice/tts.py` renvoie le MP3 gTTS dans son type MIME réel, sans dépendance `pydub`.
- `backend/tests/test_audio_upload.py` couvre les cinq formats acceptés, les erreurs de MIME/signature et la limite de taille.

Les fichiers audio ne sont pas conservés comme pièces jointes du chat : ils sont conservés en mémoire pendant le transfert, puis écrits temporairement par le moteur ASR et supprimés après traitement.

## Vérification et essai local

### Préparation

1. Installer les dépendances du backend depuis `backend/requirements.txt` et utiliser un modèle ASR configuré (`Whisper` par défaut ou Vosk).
2. Installer ou vérifier la disponibilité de `ffmpeg` dans le `PATH`. L’image Docker du backend l’installe déjà.
3. Lancer le backend depuis `backend/` avec `uvicorn main:app --reload --port 8000`.
4. Lancer le frontend depuis `frontend/` avec `npm run dev`. La capture micro nécessite HTTPS ou `localhost`.

### Contrôles automatisés

```bash
cd frontend
npm run build

cd ../backend
python -m pytest -q tests/test_audio_upload.py tests/test_asr_engine.py tests/test_asr_metrics.py tests/test_voice_response.py
```

### Contrôles manuels

1. Envoyer une question écrite et utiliser **Lire la réponse**, **Pause**, **Reprendre** puis **Arrêter**. Démarrer la lecture d’une autre réponse pendant la première : seule la nouvelle lecture doit continuer.
2. Enregistrer un message, arrêter, écouter l’aperçu, puis l’envoyer. Vérifier que la transcription et la réponse apparaissent dans le même fil de discussion.
3. Tester le refus de permission du microphone, l’annulation et l’arrêt automatique après 60 secondes.
4. Importer un fichier `.mp3`, `.wav`, `.webm`, `.ogg` et `.m4a` valides, écouter l’aperçu et l’envoyer.
5. Vérifier qu’un PDF, un fichier dont l’extension et le MIME ne correspondent pas, un fichier audio vide ou un fichier de plus de 10 Mo est refusé avec un message clair.
6. Envoyer un audio contenant une demande de relevé de notes : le serveur doit demander la vérification, puis reprendre le traitement après validation.

## Limites connues

- La lecture des réponses dépend de la Web Speech API et des voix françaises disponibles dans le navigateur et le système. Si elle n’est pas prise en charge, une erreur explicite est affichée ; l’interface ne bascule pas automatiquement vers le TTS serveur.
- La qualité de la transcription dépend du modèle ASR, du bruit ambiant et de la qualité du microphone. Whisper et Vosk nécessitent leurs modèles et dépendances propres.
- L’import est limité à 10 Mo ; l’enregistrement navigateur est limité à 60 secondes.
- Le parcours complet de transcription n’a pas pu être exécuté dans l’environnement de développement utilisé pour cette correction, car les dépendances ASR et `pytest` n’y sont pas installées. La compilation Python et les validations directes des formats, signatures et limites d’upload ont été vérifiées.
