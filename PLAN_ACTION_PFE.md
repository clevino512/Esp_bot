# Plan d'Action Complet — PFE STIC 2025-2026
## UniBot ESPA : Chatbot Universitaire Bimodal (Texte & Voix)
### ESPA Antsiranana | Université d'Antsiranana


## PARTIE I — ANALYSE STRATÉGIQUE

### 1.1 Résumé des Objectifs Clés

Le projet vise à concevoir et déployer un **assistant intelligent bimodal (texte + voix)** pour l'ESPA Antsiranana, structuré en deux phases :

**Phase PFA** (base de connaissances + moteur NLP) :
- Constituer un corpus institutionnel structuré (règlements, calendriers, procédures, FAQ)
- Implémenter un pipeline RAG performant (embedding → récupération vectorielle → génération LLM)
- Valider les performances sur 100 questions test (MRR@5, précision, taux sans réponse)

**Phase PFE** (intégration complète + déploiement) :
- Intégrer la reconnaissance vocale (Whisper en ligne, Vosk hors-ligne) adaptée au français malgache
- Intégrer la synthèse vocale (gTTS / Coqui TTS)
- Développer l'interface React multimodale (texte + voix + sources)
- Déployer sur le serveur interne ESPA avec Docker Compose + HTTPS
- Valider auprès de 30 étudiants volontaires (4 semaines, métriques SUS)

### 1.2 Défis Techniques Identifiés

| Défi | Nature | Solution Recommandée |
|---|---|---|
| **Connectivité limitée** | Infrastructure | Architecture hybride : mode en ligne (OpenAI) + mode hors-ligne (Ollama + Vosk) |
| **Français malgache** | Linguistique | Whisper large-v3 (robuste aux accents) + fine-tuning Vosk si nécessaire |
| **Qualité KB** | Données | Pipeline prétraitement strict : nettoyage PDFs, chunking sémantique 500 tokens + overlap |
| **Maintenabilité admin** | UX | Tableau de bord CRUD intuitif, zéro compétence technique requise |
| **Latence mobile** | Performance | Streaming SSE, cache Redis, embeddings pré-calculés, Whisper model "base" |
| **Hallucinations LLM** | Fiabilité | Prompt engineering défensif, citation systématique des sources, seuil de confiance |
| **Déploiement serveur ESPA** | Infrastructure | Docker Compose monolithique, Nginx + HTTPS auto-signé, documentation opérationnelle |

### 1.3 Bonnes Pratiques & Normes à Respecter

**Architecture RAG :**
- Chunk size optimal pour ce domaine : 400-600 tokens avec overlap de 50-100 tokens
- Score de similarité cosinus minimum : 0.65 (en dessous → réponse de fallback)
- Citer systématiquement les sources dans chaque réponse (document + page)
- Limiter le contexte injecté au LLM à 5 chunks maximum (éviter la dilution)

**Sécurité & RGPD :**
- Aucune donnée personnelle étudiante stockée dans la base de connaissances
- Logs anonymisés (ID de session, pas d'identité personnelle)
- Chiffrement HTTPS obligatoire pour les flux audio
- Authentification JWT avec refresh token pour l'interface admin

**Qualité du code :**
- Tests unitaires obligatoires sur le pipeline RAG (≥ 80% couverture)
- Documentation OpenAPI auto-générée par FastAPI (/docs)
- Migrations de schéma BDD via Alembic (traçabilité)
- Variables d'environnement pour toute configuration sensible

---

## PARTIE II — STACK TECHNIQUE & COMPÉTENCES

### 2.1 Stack Technologique Complète

#### Backend — Python / FastAPI

```
FastAPI 0.111+          → API REST asynchrone, auto-documentation OpenAPI
LangChain 0.2+          → Orchestration pipeline RAG
sentence-transformers   → Embeddings multilingues (paraphrase-multilingual-MiniLM)
ChromaDB 0.5+           → Base vectorielle persistante, API simple
FAISS 1.8+              → Index vectoriel k-NN haute performance
Whisper (OpenAI)        → ASR état de l'art, robuste au français
Vosk 0.3.45             → ASR hors-ligne (modèle fr 22 = ~1.8 GB RAM)
gTTS / Coqui TTS        → Synthèse vocale en ligne / hors-ligne
PostgreSQL 16           → Logs, utilisateurs, métriques (données relationnelles)
Redis 7+                → Cache sessions, historique conversations
SQLAlchemy async        → ORM async pour PostgreSQL
Alembic                 → Migrations de schéma BDD
python-jose             → JWT authentication
structlog               → Logging structuré JSON
```

#### Frontend — React / TypeScript

```
React 18 + TypeScript   → Interface utilisateur typée et maintenable
Vite 5                  → Build ultra-rapide, HMR développement
Tailwind CSS 3          → Design system utilitaire, responsive mobile-first
Axios + React Query     → Gestion API REST + cache et synchronisation d'état serveur
Zustand                 → État global minimal (thème, session)
Web Speech API          → Enregistrement vocal natif navigateur (fallback)
Recharts                → Graphiques dashboard admin (statistiques)
React Router DOM v6     → Routage SPA (/ chat, /admin)
```

#### DevOps & Infrastructure

```
Docker + Compose        → Isolation services, déploiement reproductible
Nginx 1.27              → Reverse proxy, terminaison HTTPS, assets statiques
GitHub Actions          → CI/CD : lint → test → build → push image
Makefile                → Commandes développement standardisées
.env + Pydantic Settings → Configuration centralisée et validée
```

### 2.2 Compétences Clés à Maîtriser

**Niveau Fondamental (acquis avant de coder) :**
- Architecture RAG : comprendre le flux embedding → retrieval → augmentation → génération
- API Python async (async/await, FastAPI, SQLAlchemy async)
- Docker multi-stages et Docker Compose orchestration
- Manipulations vectorielles (distance cosinus, k-NN)

**Niveau Intermédiaire (développé pendant le projet) :**
- Prompt engineering pour LLMs (system prompt, few-shot, chain-of-thought)
- Traitement du signal audio (sample rate, normalisation, VAD)
- LangChain : chains, retrievers, memory, callbacks
- sentence-transformers : fine-tuning, évaluation, batch inference
- ChromaDB : collections, metadata filtering, persistence

**Niveau Avancé (différenciation académique) :**
- Évaluation RAG : MRR@5, NDCG, précision/rappel sur datasets de référence
- Optimisation latence : streaming SSE, cache embeddings, quantification modèles
- Adaptation ASR au français malgache : analyse erreurs, post-traitement transcriptions
- Analyse comparative gTTS vs Coqui TTS : MOS subjectif, latence, autonomie

---

## PARTIE III — ARCHITECTURE & STRUCTURE

### 3.1 Architecture Logicielle Retenue

**Paradigme : Monolithe Modulaire déployé via Docker Compose**

**Justification :**
Un seul étudiant développe et maintient le projet. Les microservices distribués auraient introduit une complexité opérationnelle (service discovery, communication inter-services, debugging distribué) disproportionnée par rapport aux bénéfices. Le monolithe modulaire offre :

- **Modules isolés** : RAG, ASR, TTS, Admin, Auth — chacun dans son propre package Python, testable indépendamment
- **Déploiement simplifié** : Un seul `docker compose up` sur le serveur ESPA
- **Évolutivité future** : Chaque module peut être extrait en microservice indépendant lorsque la charge le justifie
- **Maintenabilité** : Le personnel ESPA peut relancer le service avec une simple commande

**Pipeline RAG — Flux de données :**

```
Étudiant pose une question (texte ou voix)
        │
        ▼ [si voix]
   ASR Module ──→ Transcription texte
        │
        ▼
   Embedding ──→ Vecteur question (384 dimensions)
        │
        ▼
   ChromaDB/FAISS ──→ Top-5 chunks pertinents (cosine similarity ≥ 0.65)
        │
        ▼
   Prompt Builder ──→ Contexte + Question + Instructions
        │
        ▼
   LLM (GPT-4o-mini / Mistral 7B) ──→ Réponse avec citations
        │
        ▼
   Post-traitement ──→ Formatage + Sources citées + Score confiance
        │
        ▼ [si voix activée]
   TTS Module ──→ Fichier audio réponse
        │
        ▼
   Réponse utilisateur (texte + sources + [audio optionnel])
```

### 3.2 Décisions Techniques Importantes

#### Modèle d'Embedding : `paraphrase-multilingual-MiniLM-L12-v2`

**Pourquoi :** Modèle multilingue supportant le français, dimensions 384 (léger), performances élevées sur les tâches de similarité sémantique, gratuit et exécutable en local sans API.

**Alternative considérée :** `text-embedding-3-small` (OpenAI) — rejeté car dépendance réseau et coût par token en production.

#### Base Vectorielle : ChromaDB (primaire) + FAISS (secondaire)

**ChromaDB** : persistence native, API simple, metadata filtering, interface admin possible. Choix principal pour la base de connaissances ESPA.

**FAISS** : utilisé pour l'évaluation et le prototypage rapide (index en mémoire, ultra-rapide pour batch search).

#### LLM : GPT-4o-mini (en ligne) + Mistral 7B via Ollama (hors-ligne)

**GPT-4o-mini** : excellent rapport qualité/coût, contexte 128K tokens, répond bien en français.

**Mistral 7B** (via Ollama) : modèle open-source, exécutable sur CPU 8 GB RAM, qualité acceptable pour les réponses factuelles simples. Activé automatiquement quand la connectivité internet est absente.

---

## PARTIE IV — PLAN DE TRAVAIL & JALONS

### Planning PFA — 4 Mois

| Semaine | Tâches | Livrable |
|---|---|---|
| S1-S2 | Revue bibliographique RAG (Stanford OHS, Jill Watson, UniBOT) | Rapport état de l'art (15 pages) |
| S3-S4 | Collecte et audit documents institutionnels ESPA | Corpus brut annoté (catégories) |
| S5-S6 | Prétraitement corpus (nettoyage PDFs, chunking, étiquetage) | Corpus prétraité (JSONL) |
| S7-S8 | Indexation vectorielle (embeddings + ChromaDB) | Index vectoriel opérationnel |
| S9-S10 | Implémentation pipeline RAG (LangChain) | API /api/chat fonctionnelle |
| S11 | Prompt engineering et tuning des paramètres | Prompts validés |
| S12 | Mécanisme fallback + détection hors-domaine | Fallback opérationnel |
| S13-S14 | Évaluation MRR@5 sur 100 questions + rapport PFA | Rapport PFA soumis |

### Planning PFE — 6 Mois

| Mois | Tâches | Livrable |
|---|---|---|
| M1 | Intégration Whisper ASR + tests sur audio français malgache | Module ASR validé |
| M2 | Intégration TTS (gTTS + Coqui) + comparaison + interface React | Interface texte+voix MVP |
| M3 | Tableau de bord administrateur + authentification JWT | Admin dashboard complet |
| M4 | Déploiement Docker Compose production + HTTPS serveur ESPA | Système en production |
| M5 | Test pilote 30 étudiants + collecte métriques SUS | Données évaluation utilisateurs |
| M6 | Rédaction mémoire + préparation soutenance | Mémoire PFE soumis |

---

## PARTIE V — DOCUMENTATION TECHNIQUE (Structure /docs)

```
docs/
├── 01_architecture.md
│   ├── Diagramme architecture globale
│   ├── Flux de données (texte et voix)
│   ├── Décisions architecturales (ADR)
│   └── Schéma base de données
│
├── 02_rag_pipeline.md
│   ├── Théorie RAG (embedding, retrieval, generation)
│   ├── Choix du modèle d'embedding (justification)
│   ├── Stratégie de chunking (taille, overlap, sémantique)
│   ├── Paramétrage ChromaDB (collection, distance function)
│   ├── Prompt templates annotés
│   └── Mécanisme de fallback (détection hors-domaine)
│
├── 03_voice_integration.md
│   ├── Whisper — Installation, modèles, benchmark latence
│   ├── Vosk — Installation modèle français, configuration
│   ├── gTTS — API, paramètres, limitations
│   ├── Coqui TTS — Installation, modèles, benchmark
│   └── Tableau comparatif ASR et TTS
│
├── 04_admin_guide.md
│   ├── Accès tableau de bord
│   ├── Ajouter / modifier / supprimer un document
│   ├── Consulter les logs et statistiques
│   ├── Identifier les questions sans réponse
│   └── Procédure de sauvegarde
│
├── 05_evaluation_methodology.md
│   ├── Protocole évaluation moteur NLP (MRR@5, BLEU)
│   ├── Constitution du jeu de 100 questions test
│   ├── Protocole test pilote utilisateurs (SUS, Likert)
│   └── Résultats et analyse
│
└── 06_deployment.md
    ├── Prérequis serveur ESPA
    ├── Installation Docker sur Ubuntu Server
    ├── Configuration .env production
    ├── Déploiement Docker Compose production
    ├── Configuration HTTPS (certificat auto-signé)
    ├── Procédure de mise à jour
    └── Résolution des problèmes courants
```

---

## CONCLUSION

Ce plan d'action positionne votre PFE comme un projet de **niveau professionnel** en intelligence artificielle appliquée, avec :

1. **Une contribution scientifique réelle** : adaptation du paradigme RAG au contexte universitaire malgache avec dimension vocale
2. **Un impact institutionnel direct** : système opérationnel sur le serveur ESPA, maintenable sans compétences techniques avancées
3. **Une rigueur académique** : évaluation quantitative (MRR@5, SUS), méthodologie reproductible, documentation exhaustive
4. **Une maîtrise technologique démontrée** : stack complète IA (LLM + embeddings + ASR + TTS) + fullstack web (FastAPI + React) + DevOps (Docker + CI/CD)

La réussite de ce PFE repose sur trois piliers : la **qualité de la base de connaissances** (GIGO : Garbage In, Garbage Out), la **rigueur du prompt engineering**, et la **validation terrain** auprès des utilisateurs réels de l'ESPA.

---

*Document confidentiel — Usage académique exclusif ESPA Antsiranana*
