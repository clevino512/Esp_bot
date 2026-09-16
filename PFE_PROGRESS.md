# UniBot ESPA — Suivi PFE

Branche de développement : `pfe-whisper-asr`

## Phase 1 — Reconnaissance vocale (ASR)

- [x] Conserver l'architecture ASR existante et isoler Whisper/Vosk
- [x] Supporter explicitement Whisper `tiny`, `base`, `medium`
- [x] Charger/cacher les modèles pour éviter un rechargement à chaque requête
- [x] Mesurer le temps de traitement et le Real-Time Factor (RTF)
- [x] Ajouter le calcul du Word Error Rate (WER)
- [x] Ajouter un script reproductible de benchmark tiny/base/medium
- [x] Ajouter des tests unitaires pour la métrique WER
- [x] Renforcer la validation des fichiers audio
- [ ] Constituer/enregistrer le vrai corpus audio français ESPA
- [ ] Exécuter les benchmarks sur la machine cible et enregistrer les résultats réels
- [ ] Sélectionner le modèle final à partir des résultats réels

## Phase 2 — Synthèse vocale (TTS)

- [ ] Auditer l'implémentation gTTS/Coqui existante
- [ ] Mesurer latence, qualité perçue et fonctionnement hors-ligne
- [ ] Sélectionner le moteur selon les résultats

## Phase 3 — Expérience bimodale React

- [ ] Enregistrement microphone et envoi audio
- [ ] Affichage transcription + réponse + sources
- [ ] Lecture TTS de la réponse
- [ ] Historique et mode sombre

## Phase 4 — Administration et évaluation

- [ ] Vérifier/compléter CRUD documentaire
- [ ] Logs et statistiques d'usage
- [ ] Questions fréquentes sans réponse
- [ ] Instrumentation résolution, fallback et satisfaction
- [ ] Questionnaire SUS et protocole pilote 30 étudiants / 4 semaines

## Phase 5 — Déploiement

- [ ] Vérifier Docker Compose FastAPI + ChromaDB + PostgreSQL/Redis + React
- [ ] Préparer configuration production et HTTPS
- [ ] Documentation d'installation, exploitation et sauvegarde

> Les WER, latences, scores SUS, taux de résolution et comparaisons finales ne doivent être renseignés qu'après des expérimentations réelles.
