# Cahier des Charges — Périmètre du Projet UniBot ESPA (PFA)

## 1. Contexte

Le projet UniBot ESPA vise à développer un chatbot universitaire bimodal (texte & voix) pour l'École Supérieure Polytechnique d'Antsiranana. Ce Cahier des Charges définit le périmètre fonctionnel et technique attendu pour la phase PFA (Période de Fin d'Année / Projet de Fin d'Études).

## 2. Objectifs

- Fournir un assistant conversational capable de répondre aux questions des étudiants et du personnel en s'appuyant sur la base de connaissances institutionnelle.
- Supporter les interactions en texte et en voix (ASR + TTS).
- Permettre la gestion de la base de connaissances par une interface administrateur.
- Assurer un déploiement reproductible via Docker Compose et documentation pour production.

## 3. Périmètre Fonctionnel (Inclus)

- Chat texte : saisie utilisateur → réponse générée (RAG) avec sources citées.
- Chat vocal : enregistrement audio → transcription (ASR) → pipeline RAG → réponse texte et synthèse vocale (TTS).
- Base de connaissances : ingestion de documents (PDF, DOCX, TXT, Markdown), prétraitement, chunking et indexation vectorielle (ChromaDB/FAISS).
- Admin Dashboard : upload/gestion documents, réindexation, consultation logs et métriques basiques.
- Authentification basique pour l'accès admin (JWT).
- Endpoints API REST (FastAPI) pour chat, voice, admin et statut.
- Historique de session (temporaire/session ou persisté selon configuration).

## 4. Hors Périmètre (Exclus)

- Intégration de systèmes tiers complexes (SIRH, ERP) non documentés.
- Interface mobile native (seule la PWA/React web est visée).
- Modèles LLM entièrement entraînés depuis zéro (utilisation d'APIs OpenAI / modèles locaux préexistants via Ollama/Mistral).
- Traduction automatique complète multi-langues (seule prise en charge du français / variantes locales).

## 5. Périmètre Technique

- Backend : Python 3.11+, FastAPI, LangChain pour orchestration RAG.
- Embeddings : `sentence-transformers` (paraphrase-multilingual ou équivalent).
- Vector DB : ChromaDB (persistant) et/ou FAISS pour recherche locale.
- ASR : Whisper (online) et Vosk (offline) comme fallback.
- TTS : gTTS (online) et Coqui TTS (offline) comme fallback.
- Base de données relationnelle : PostgreSQL (logs, users, métriques).
- Cache / session : Redis.
- Frontend : React + TypeScript (Vite), composants pour chat et admin.
- Déploiement : Docker + Docker Compose (dev & prod compose files).

## 6. Exigences Non-Fonctionnelles

- Performances : latence texte (P95) ≤ 3s pour requêtes RAG simples.
- ASR latence (P95) ≤ 2s pour fichiers audio courts (≤ 10s) en mode en ligne.
- Disponibilité : service backend prêt pour déploiement sur un seul serveur (8 GB RAM min recommandé).
- Sécurité : chiffrement TLS en production, stockage sécurisé des secrets (.env), authentification JWT pour admin.
- Scalabilité : architecture modulaire permettant d'isoler ChromaDB / Postgres / Redis en services.
- Observabilité : logs structurés (structlog) et métriques basiques (taux de réussite, latence moyenne).

## 7. Contraintes

- Ressources matérielles limitées (cible serveur ESPA sans GPU obligatoire).
- Respect de la vie privée et des données personnelles (pas de stockage audio utilisateur non autorisé, anonymisation des logs si nécessaire).
- Dépendances externes (OpenAI / services cloud) optionnelles : prévoir modes hors-ligne via modèles locaux.

## 8. Livrables

- Code source complet (backend + frontend) dans un repo git organisé.
- `docker-compose.yml` et `docker-compose.prod.yml` pour déploiement.
- Scripts d'ingestion et d'indexation des documents (`scripts/ingest_documents.py`).
- Documentation technique (dans `/docs/`) incluant guide déploiement, architecture et utilisation.
- Jeu de tests unitaires et d'intégration minimaux pour le backend.
- Rapport PFA synthétique et présentation (slides).

## 9. Planning & Jalons (suggestion)

- Semaine 1–2 : Collecte documents, préparation corpus, prétraitement.
- Semaine 3–4 : Implémentation pipeline RAG, embeddings et indexation.
- Semaine 5 : Intégration ASR/TTS (Whisper/Vosk + gTTS/Coqui) et endpoints voix.
- Semaine 6 : Frontend chat + admin minimal.
- Semaine 7 : Tests, évaluation MRR@5, corrections.
- Semaine 8 : Packaging Docker, documentation, préparation soutenance.

> Ces jalons sont adaptables selon avancement et contraintes.

## 10. Critères d'Acceptation

- Le service répond à des requêtes texte et fournit des sources citables.
- L'ASR peut transcrire fichiers audio courts avec précision acceptable (qualitative).
- L'admin peut uploader un document et voir ses chunks indexés.
- Les scripts d'initialisation et `docker compose up --build` permettent de lancer l'application localement.
- Les tests unitaires principaux passent (coverage raisonnable sur modules modifiés).

## 11. Risques & Mesures d'Atténuation

- Risque : Latence élevée ou coûts API externes → Mesure : option hors-ligne et cache réponses.
- Risque : Données sensibles exposées → Mesure : masquer/anonymiser logs, limiter rétention.
- Risque : Manque de documents structurés → Mesure : prévoir étape de nettoyage/normalisation et métadonnées manuelles.

## 12. Rôles & Responsabilités

- Étudiant (développeur principal) : implémentation, tests, documentation.
- Encadreurs : validation fonctionnelle, revue PFA, jeu de tests métier.
- Administrateur ESPA : fournir documents, valider déploiement serveur.

## 13. Maintenance & Évolutivité

- Documenter procédures de réindexation et d'ajout de documents.
- Prévoir scripts pour migration DB (Alembic) et backups.
- Architecture modulable pour remplacer LLMs ou DB vecteur sans refonte complète.

---

Pour toute modification du périmètre ou ajout de fonctionnalité, enregistrer un addendum à ce Cahier des Charges et notifier les encadreurs.