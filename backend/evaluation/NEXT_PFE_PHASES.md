# Prochaines phases techniques

Après validation réelle de l'ASR :

1. **TTS** — comparer gTTS et Coqui : latence, naturalité perçue, dépendance réseau/hors-ligne.
2. **Chaîne bimodale** — audio utilisateur → Whisper → RAG → texte → TTS, avec gestion claire des erreurs/fallback.
3. **React** — bouton micro, état d'enregistrement, transcription, sources, lecture audio, historique, mode sombre.
4. **Administration** — documents, logs, statistiques, questions non résolues, indicateurs de satisfaction.
5. **Évaluation utilisateur** — instrumentation du taux de résolution, préférence texte/voix et questionnaire SUS pour le pilote prévu.
6. **Déploiement** — Docker Compose, configuration production, HTTPS, sauvegardes et documentation d'exploitation.

Chaque phase doit être validée avant d'être considérée comme terminée. Les données expérimentales seront produites par les tests réels, pas simulées.
