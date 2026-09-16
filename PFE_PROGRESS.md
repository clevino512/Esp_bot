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
- [x] Endpoint et service React de synthèse présents
- [x] Bouton d'écoute TTS ajouté aux réponses de l'assistant
- [ ] Comparer réellement gTTS et Coqui : latence, naturalité et mode hors-ligne
- [ ] Sélectionner le moteur à partir des résultats

## Phase 3 — Interface React bimodale
- [x] Chat React texte
- [x] Enregistrement microphone avec MediaRecorder
- [x] États accès micro / enregistrement / transcription / annulation
- [x] Envoi du vrai format WebM/Opus à Whisper
- [x] Service ASR aligné avec `tiny/base/medium`
- [x] Affichage réponses + sources + historique + mode sombre
- [x] Lecture TTS déclenchée par l'utilisateur sur chaque réponse
- [x] Modalité `text` / `voice` transmise au backend pour l'évaluation
- [ ] Validation navigateur réelle micro → Whisper → RAG → réponse → TTS

## Phase 4 — Dashboard Admin et évaluation
- [x] Dashboard, documents, étudiants, logs, statistiques, SUS, témoignages, paramètres
- [x] Nouvelle page `Évaluation PFE`
- [x] Endpoint `/admin/pfe-evaluation`
- [x] Instrumentation usage texte/voix
- [x] Calcul taux de résolution et fallback
- [x] Calcul feedback utile et temps moyen
- [x] Intégration nombre/moyenne des réponses SUS
- [x] Indicateurs actualisés automatiquement dans React
- [ ] Valider les routes avec le backend réel
- [ ] Réaliser le pilote réel 30 étudiants / 4 semaines

## Phase 5 — Déploiement
- [ ] Vérifier Docker Compose FastAPI + ChromaDB + PostgreSQL/Redis + React
- [ ] Préparer configuration production et HTTPS
- [ ] Documentation d'installation, exploitation et sauvegarde

> Les fonctionnalités logicielles cochées sont implémentées dans la branche. Les résultats expérimentaux (WER, latence, SUS, résolution, préférence texte/voix) ne seront considérés comme validés qu'après tests réels.
