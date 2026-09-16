# UniBot ESPA — Suivi PFE

Branche de développement : `pfe-whisper-asr`

## Phase 1 — Reconnaissance vocale (ASR)
- [x] Architecture Whisper/Vosk
- [x] Whisper `tiny`, `base`, `medium`
- [x] Cache modèles, latence, RTF et WER
- [x] Benchmark reproductible et tests unitaires
- [x] Validation des formats audio
- [ ] Enregistrer le vrai corpus audio français ESPA
- [ ] Exécuter les benchmarks sur la machine cible
- [ ] Sélectionner le modèle final à partir des mesures réelles

## Phase 2 — Synthèse vocale (TTS)
- [x] Endpoint et service React de synthèse déjà présents
- [ ] Comparer réellement gTTS et Coqui : latence, naturalité et mode hors-ligne
- [ ] Sélectionner le moteur à partir des résultats

## Phase 3 — Interface React bimodale
- [x] Chat React texte existant
- [x] Enregistrement microphone avec MediaRecorder
- [x] États accès micro / enregistrement / transcription / annulation
- [x] Envoi du vrai format WebM/Opus à Whisper (plus de faux nom `.wav`)
- [x] Service ASR aligné avec `tiny/base/medium`
- [x] Affichage des réponses et sources existant
- [x] Historique/session existant
- [x] Mode sombre existant
- [x] Service de lecture TTS disponible
- [ ] Validation navigateur réelle de la chaîne micro → Whisper → chat
- [ ] Finaliser le déclenchement UX de lecture TTS selon le choix utilisateur

## Phase 4 — Dashboard Admin et évaluation
- [x] Tableau de bord administrateur existant
- [x] Gestion documentaire existante
- [x] Gestion des étudiants autorisés existante
- [x] Conversations/logs existants
- [x] Statistiques : conversations, satisfaction, confiance, fallback, temps de réponse
- [x] Questions fréquentes et questions sans réponse
- [x] Panneau SUS existant
- [x] Témoignages utilisateurs existants
- [x] Paramètres administrateur existants
- [x] Export de rapport présent dans le dashboard
- [ ] Valider toutes les routes admin avec le backend réel
- [ ] Produire les mesures du pilote 30 étudiants / 4 semaines

## Phase 5 — Déploiement
- [ ] Vérifier Docker Compose FastAPI + ChromaDB + PostgreSQL/Redis + React
- [ ] Préparer configuration production et HTTPS
- [ ] Documentation d'installation, exploitation et sauvegarde

> Les fonctions marquées « existantes » ont été constatées dans le code de la branche. Elles ne sont considérées comme expérimentalement validées qu'après exécution réelle. Les WER, latences, scores SUS et taux de résolution ne doivent pas être inventés.
