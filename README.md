# 🎓 UniBot ESPA — Chatbot Universitaire Bimodal (Texte & Voix)

> **Projet de Fin d'Études (PFE) — Mention STIC | Année Universitaire 2025-2026**  
> École Supérieure Polytechnique d'Antsiranana — Université d'Antsiranana  
> Encadreurs : Dr. HDR ANDRIANAJAINA Todizara & Mr. RAKOTOARIJAONA Raonirivo

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-orange?style=flat-square)](https://www.trychroma.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 📋 Table des Matières

1. [Présentation du Projet](#-présentation-du-projet)
2. [Problématique & Objectifs](#-problématique--objectifs)
3. [Architecture Système](#-architecture-système)
4. [Stack Technologique](#-stack-technologique)
5. [Structure du Projet](#-structure-du-projet)
6. [Prérequis](#-prérequis)
7. [Installation & Démarrage](#-installation--démarrage)
8. [Configuration](#-configuration)
9. [Utilisation](#-utilisation)
10. [Documentation Technique](#-documentation-technique)
11. [Tests & Évaluation](#-tests--évaluation)
12. [Déploiement en Production](#-déploiement-en-production)
13. [Contribution](#-contribution)
14. [Licence](#-licence)

---

## 🎯 Présentation du Projet

**UniBot ESPA** est un système de chatbot universitaire bimodal (texte et voix) conçu pour l'ESPA Antsiranana. Il exploite les techniques modernes de NLP (Traitement du Langage Naturel) et de RAG (Retrieval-Augmented Generation) pour fournir une assistance automatisée, précise et contextuelle aux étudiants et au personnel administratif.

### Caractéristiques Principales

| Fonctionnalité | Description |
|---|---|
| 🧠 **NLP / RAG** | Compréhension sémantique + génération de réponses contextuelles via LLM |
| 🎙️ **ASR** | Reconnaissance vocale adaptée au français malgache (Whisper / Vosk) |
| 🔊 **TTS** | Synthèse vocale naturelle (gTTS / Coqui TTS) |
| 🗄️ **Base de Connaissances** | Indexation vectorielle FAISS / ChromaDB des documents institutionnels ESPA |
| 🖥️ **Interface Web** | React.js — chat texte + enregistrement vocal + affichage des sources |
| 🛡️ **Tableau de Bord Admin** | Gestion de la base de connaissances, logs, statistiques d'utilisation |
| 📶 **Mode Hors-Ligne** | Fallback Vosk ASR + Mistral 7B local via Ollama |

---

## 🔬 Problématique & Objectifs

### Problématique

> *Comment concevoir et déployer un chatbot universitaire bimodal (texte et voix) capable de comprendre les questions des étudiants en langage naturel français, d'y répondre de manière précise et contextuelle en s'appuyant sur la base de connaissances institutionnelle de l'ESPA Antsiranana, de fonctionner efficacement sur smartphone dans des conditions de connectivité variable, et d'être maintenu et mis à jour par le personnel administratif sans compétences techniques avancées ?*

### Objectifs du PFA (Phase 1 — Base de Connaissances + Moteur NLP)

- [x] Revue bibliographique des architectures RAG et benchmarks (Stanford OHS, Georgia Tech Jill Watson, UniBOT)
- [ ] Collecte exhaustive des documents institutionnels ESPA (règlements, calendriers, FAQ, procédures)
- [ ] Prétraitement corpus : nettoyage PDFs, chunking sémantique (~500 tokens + overlap), étiquetage catégories
- [ ] Indexation vectorielle : embeddings `sentence-transformers`, construction index FAISS
- [ ] Implémentation pipeline RAG (LangChain) : récupération → prompt engineering → génération → post-traitement
- [ ] Évaluation moteur NLP : MRR@5, précision, taux sans réponse — sur 100 questions test
- [ ] Mécanisme de fallback : détection hors-domaine, redirection contact humain

### Objectifs du PFE (Phase 2 — Intégration Vocale + Interface + Déploiement)

- [ ] Intégration ASR Whisper (en ligne) + Vosk (hors-ligne) — adaptation français malgache
- [ ] Intégration TTS : gTTS vs Coqui TTS — comparaison naturalité, latence, autonomie hors-ligne
- [ ] Développement interface React : zone chat + bouton enregistrement vocal + historique + mode sombre
- [ ] Tableau de bord administrateur : CRUD base de connaissances, consultation logs, statistiques
- [ ] Déploiement Docker Compose (FastAPI + ChromaDB + React) sur serveur ESPA avec HTTPS
- [ ] Test pilote : 30 étudiants volontaires, 4 semaines, métriques SUS + taux de résolution

---

## 🏗️ Architecture Système

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │  React App   │  │   Mobile     │  │  Admin Dashboard    │   │
│  │  (Texte+Voix)│  │  Smartphone  │  │  (Gestion KB+Logs)  │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬──────────┘   │
└─────────┼─────────────────┼───────────────────── ┼─────────────-┘
          │                 │ REST/WebSocket        │
          ▼                 ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND — FastAPI (Python 3.11)                │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐  ┌───────────┐  │
│  │ /api/chat  │  │ /api/voice │  │ /api/admin │  │ /api/auth │  │
│  │  (RAG)     │  │ (ASR/TTS)  │  │  (CRUD KB) │  │  (JWT)    │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └───────────┘  │
│        │               │               │                          │
│  ┌─────▼───────────────▼───────────────▼──────────────────────┐  │
│  │              CORE ENGINE (LangChain)                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │ Retriever│  │ Prompt   │  │  LLM     │  │ Fallback │   │  │
│  │  │ (FAISS / │  │ Engineer │  │ (GPT-4o /│  │ Detector │   │  │
│  │  │ChromaDB) │  │          │  │ Mistral) │  │          │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────┐  ┌─────────────────────────────────┐  │
│  │  ASR Module          │  │  TTS Module                     │  │
│  │  Whisper (en ligne)  │  │  gTTS (en ligne)                │  │
│  │  Vosk (hors-ligne)   │  │  Coqui TTS (hors-ligne)         │  │
│  └──────────────────────┘  └─────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────-┘
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ChromaDB  │  │PostgreSQL│  │  Redis   │
    │(Vecteurs)│  │(Logs,    │  │(Sessions,│
    │          │  │ Users,   │  │ Cache)   │
    │          │  │ Metrics) │  │          │
    └──────────┘  └──────────┘  └──────────┘
```

**Paradigme architectural :** Monolithe Modulaire déployé via Docker Compose — choix justifié par la taille de l'équipe (1 étudiant), la contrainte d'infrastructure ESPA (serveur unique), et la nécessité de maintenabilité post-PFE par le personnel non-technique. L'isolation des modules (ASR, TTS, RAG, Admin) garantit une évolutivité future vers des microservices si nécessaire.

---

## 🛠️ Stack Technologique

### Backend

| Technologie | Version | Justification |
|---|---|---|
| **Python** | 3.11+ | Écosystème NLP/IA dominant (HuggingFace, LangChain, transformers) |
| **FastAPI** | 0.111+ | API REST asynchrone hautes performances, documentation OpenAPI auto-générée |
| **LangChain** | 0.2+ | Orchestration du pipeline RAG (récupération → génération) |
| **sentence-transformers** | 3.x | Embeddings sémantiques multilingues (paraphrase-multilingual-MiniLM) |
| **ChromaDB** | 0.5+ | Base vectorielle persistante, simple à opérer sans DBA |
| **FAISS** | 1.8+ | Index vectoriel haute performance pour recherche k-NN |
| **Whisper (OpenAI)** | large-v3 | ASR état de l'art, adapté au français |
| **Vosk** | 0.3.45 | ASR hors-ligne léger pour mode dégradé |
| **gTTS / Coqui TTS** | latest | Synthèse vocale : en ligne (gTTS) et hors-ligne (Coqui) |
| **PostgreSQL** | 16 | Persistance relationnelle : logs, utilisateurs, métriques |
| **Redis** | 7+ | Cache sessions et historique conversations |

### Frontend

| Technologie | Version | Justification |
|---|---|---|
| **React** | 18.x | Standard industrie, composants réutilisables, écosystème riche |
| **TypeScript** | 5.x | Typage statique, maintenabilité accrue |
| **Tailwind CSS** | 3.x | Design system utilitaire, cohérence visuelle rapide |
| **Axios** | 1.x | Gestion des requêtes HTTP/REST |
| **React Query** | 5.x | Gestion d'état serveur, cache et synchronisation |
| **Web Speech API** | Native | Interface vocale navigateur (fallback) |

### DevOps & Infrastructure

| Technologie | Justification |
|---|---|
| **Docker + Docker Compose** | Déploiement reproductible sur serveur ESPA, isolation des services |
| **Nginx** | Reverse proxy, terminaison HTTPS, serveur statique frontend |
| **Let's Encrypt / Auto-signé** | Certificat HTTPS pour sécurisation des flux audio/données |
| **GitHub Actions** | CI/CD : tests automatisés, build Docker à chaque push |

---

## 📁 Structure du Projet

```
unibot-espa/
├── 📄 README.md
├── 📄 docker-compose.yml
├── 📄 docker-compose.prod.yml
├── 📄 .env.example
├── 📄 .gitignore
├── 📄 Makefile                         # Commandes raccourcis (make dev, make build...)
│
├── 📂 backend/                         # Service FastAPI — Cœur du système
│   ├── 📄 Dockerfile
│   ├── 📄 requirements.txt
│   ├── 📄 pyproject.toml
│   ├── 📄 main.py                      # Point d'entrée FastAPI + config CORS/middleware
│   │
│   ├── 📂 app/
│   │   ├── 📂 api/                     # Couche Routes REST
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 chat.py              # POST /api/chat — pipeline RAG texte
│   │   │   ├── 📄 voice.py             # POST /api/voice/asr, /api/voice/tts
│   │   │   ├── 📄 admin.py             # CRUD /api/admin/documents, /api/admin/logs
│   │   │   └── 📄 auth.py              # POST /api/auth/login, /api/auth/refresh
│   │   │
│   │   ├── 📂 core/                    # Logique métier principale
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 rag_pipeline.py      # Pipeline RAG LangChain complet
│   │   │   ├── 📄 retriever.py         # Récupération vectorielle FAISS/ChromaDB
│   │   │   ├── 📄 embedder.py          # Génération embeddings sentence-transformers
│   │   │   ├── 📄 llm_client.py        # Client LLM (OpenAI GPT-4o / Mistral Ollama)
│   │   │   ├── 📄 prompt_templates.py  # Templates de prompts engineerés
│   │   │   └── 📄 fallback.py          # Détection hors-domaine + redirection
│   │   │
│   │   ├── 📂 voice/                   # Modules Audio
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 asr.py               # Whisper (en ligne) + Vosk (hors-ligne)
│   │   │   └── 📄 tts.py               # gTTS (en ligne) + Coqui TTS (hors-ligne)
│   │   │
│   │   ├── 📂 knowledge/               # Gestion Base de Connaissances
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 document_loader.py   # Chargement PDFs, DOCX, TXT (pdfplumber, pypdf)
│   │   │   ├── 📄 preprocessor.py      # Nettoyage, chunking 500 tokens + overlap
│   │   │   ├── 📄 indexer.py           # Construction index FAISS / ChromaDB
│   │   │   └── 📄 knowledge_base.py    # CRUD base de connaissances
│   │   │
│   │   ├── 📂 models/                  # Modèles de données Pydantic
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 chat.py              # ChatRequest, ChatResponse, Source
│   │   │   ├── 📄 voice.py             # ASRResponse, TTSRequest
│   │   │   ├── 📄 document.py          # Document, Chunk, Category
│   │   │   └── 📄 user.py              # User, AdminUser, Token
│   │   │
│   │   ├── 📂 db/                      # Couche Base de Données
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 database.py          # Connexion PostgreSQL (SQLAlchemy async)
│   │   │   ├── 📄 repositories/
│   │   │   │   ├── 📄 log_repo.py      # CRUD logs conversations
│   │   │   │   ├── 📄 metric_repo.py   # Métriques (taux résolution, MRR)
│   │   │   │   └── 📄 user_repo.py     # CRUD utilisateurs admin
│   │   │   └── 📂 migrations/          # Alembic — migrations schéma BDD
│   │   │
│   │   ├── 📂 middleware/
│   │   │   ├── 📄 auth_middleware.py   # Vérification JWT
│   │   │   ├── 📄 rate_limiter.py      # Limitation requêtes (slowapi)
│   │   │   └── 📄 logger.py            # Logging structuré (structlog)
│   │   │
│   │   └── 📂 config/
│   │       ├── 📄 settings.py          # Configuration Pydantic Settings (env vars)
│   │       └── 📄 constants.py         # Constantes métier (chunk_size, top_k, etc.)
│   │
│   └── 📂 tests/
│       ├── 📄 conftest.py
│       ├── 📂 unit/
│       │   ├── 📄 test_rag_pipeline.py
│       │   ├── 📄 test_retriever.py
│       │   └── 📄 test_preprocessor.py
│       ├── 📂 integration/
│       │   ├── 📄 test_chat_api.py
│       │   └── 📄 test_voice_api.py
│       └── 📂 evaluation/
│           ├── 📄 eval_100_questions.py  # Évaluation MRR@5 sur 100 questions
│           └── 📄 questions_test.json    # Jeu de questions de référence
│
├── 📂 frontend/                        # Application React — Interface Utilisateur
│   ├── 📄 Dockerfile
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 tailwind.config.js
│   ├── 📄 vite.config.ts
│   │
│   └── 📂 src/
│       ├── 📄 main.tsx
│       ├── 📄 App.tsx
│       │
│       ├── 📂 components/
│       │   ├── 📂 chat/
│       │   │   ├── 📄 ChatWindow.tsx       # Fenêtre de conversation principale
│       │   │   ├── 📄 MessageBubble.tsx    # Bulle message (texte + sources citées)
│       │   │   ├── 📄 InputBar.tsx         # Zone saisie texte + bouton micro
│       │   │   └── 📄 VoiceButton.tsx      # Bouton enregistrement vocal (Web API)
│       │   ├── 📂 admin/
│       │   │   ├── 📄 AdminDashboard.tsx   # Dashboard principal admin
│       │   │   ├── 📄 DocumentManager.tsx  # Upload/gestion documents KB
│       │   │   ├── 📄 LogsViewer.tsx       # Consultation logs conversations
│       │   │   └── 📄 StatsPanel.tsx       # Statistiques utilisation
│       │   └── 📂 ui/
│       │       ├── 📄 Button.tsx
│       │       ├── 📄 Modal.tsx
│       │       └── 📄 ThemeToggle.tsx      # Mode clair/sombre
│       │
│       ├── 📂 hooks/
│       │   ├── 📄 useChat.ts              # Hook gestion conversation
│       │   ├── 📄 useVoiceRecorder.ts     # Hook enregistrement audio
│       │   └── 📄 useAuth.ts             # Hook authentification admin
│       │
│       ├── 📂 services/
│       │   ├── 📄 chatService.ts          # Appels API /api/chat
│       │   ├── 📄 voiceService.ts         # Appels API /api/voice
│       │   └── 📄 adminService.ts         # Appels API /api/admin
│       │
│       └── 📂 types/
│           └── 📄 index.ts               # Types TypeScript partagés
│
├── 📂 knowledge-base/                  # Documents institutionnels ESPA
│   ├── 📂 raw/                         # Documents sources originaux (PDFs, DOCX)
│   │   ├── 📂 reglements/
│   │   ├── 📂 calendriers/
│   │   ├── 📂 procedures/
│   │   └── 📂 faq/
│   └── 📂 processed/                   # Corpus prétraité et indexé
│       ├── 📄 chunks.jsonl             # Chunks sémantiques avec métadonnées
│       └── 📄 index/                   # Index FAISS / ChromaDB persisté
│
├── 📂 scripts/                         # Scripts utilitaires
│   ├── 📄 ingest_documents.py          # Ingestion et indexation de nouveaux docs
│   ├── 📄 evaluate_rag.py              # Script d'évaluation MRR@5
│   ├── 📄 export_logs.py               # Export logs pour analyse
│   └── 📄 init_db.sql                  # Initialisation schéma PostgreSQL
│
├── 📂 nginx/                           # Configuration Nginx
│   ├── 📄 nginx.conf
│   └── 📄 ssl/                         # Certificats HTTPS
│
└── 📂 docs/                            # Documentation technique
    ├── 📄 01_architecture.md
    ├── 📄 02_rag_pipeline.md
    ├── 📄 03_voice_integration.md
    ├── 📄 04_admin_guide.md
    ├── 📄 05_evaluation_methodology.md
    └── 📄 06_deployment.md
```

---

## ✅ Prérequis

### Environnement de Développement

| Outil | Version minimale | Vérification |
|---|---|---|
| Python | 3.11+ | `python --version` |
| Node.js | 20+ LTS | `node --version` |
| Docker | 24+ | `docker --version` |
| Docker Compose | 2.20+ | `docker compose version` |
| Git | 2.40+ | `git --version` |

### Ressources Matérielles Recommandées

| Environnement | RAM | CPU | Stockage | GPU |
|---|---|---|---|---|
| Développement | 16 GB | 4 cœurs | 50 GB SSD | Optionnel (CPU OK) |
| Production ESPA | 8 GB min | 4 cœurs | 100 GB | Non requis |

---

## 🚀 Installation & Démarrage

### Option 1 — Démarrage Rapide avec Docker (Recommandé)

```bash
# 1. Cloner le dépôt
git clone https://github.com/espa-antsiranana/esp-bot.git
cd unibot-espa

# 2. Configurer les variables d'environnement
cp .env.example .env


# 3. Construire et démarrer tous les services
docker compose up --build

# 4. Vérifier que tous les services sont actifs
docker compose ps

# 5. Initialiser la base de données
docker compose exec backend python scripts/init_db.py

# 6. Ingérer les premiers documents ESPA
docker compose exec backend python scripts/ingest_documents.py --source /app/knowledge-base/raw/
```

L'application est accessible à :
- **Frontend** : http://localhost:3000
- **API Documentation** : http://localhost:8000/docs
- **Admin Dashboard** : http://localhost:3000/admin

### Option 2 — Installation Manuelle (Développement)

#### Backend Python

```bash
cd backend

# Créer et activer l'environnement virtuel
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .\.venv\Scripts\Activate.ps1  # Windows

# Installer les dépendances
pip install --upgrade pip
pip install -r requirements.txt

# Démarrer les services tiers (ChromaDB, PostgreSQL, Redis) via Docker
docker compose up chromadb postgres redis -d

#demarrer chroma manuellement 
chroma run --path ./chroma_data --host 127.0.0.1 --port 8000


# Lancer le serveur de développement
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend React

```bash
cd frontend

# Installer les dépendances Node.js
npm install

# Lancer le serveur de développement Vite
npm run dev
```

---

## ⚙️ Configuration

Copier `.env.example` vers `.env` et renseigner les valeurs :

```dotenv
# ========================================
# LLM — Modèle de Langage
# ========================================
OPENAI_API_KEY=sk-...                    # Clé API OpenAI (GPT-4o-mini)
LLM_PROVIDER=openai                      # openai | ollama (mode hors-ligne)
OLLAMA_BASE_URL=http://localhost:11434   # URL Ollama si mode local
OLLAMA_MODEL=mistral:7b                  # Modèle local Ollama

# ========================================
# Base Vectorielle
# ========================================
CHROMA_HOST=chromadb
CHROMA_PORT=8001
CHROMA_COLLECTION=espa_knowledge_base
EMBEDDING_MODEL=paraphrase-multilingual-MiniLM-L12-v2

# ========================================
# PostgreSQL
# ========================================
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=unibot_db
POSTGRES_USER=unibot_user
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# ========================================
# Redis
# ========================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD

# ========================================
# Sécurité JWT
# ========================================
SECRET_KEY=CHANGE_ME_GENERATE_WITH_openssl_rand_hex_32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ========================================
# ASR / TTS
# ========================================
WHISPER_MODEL=base                       # tiny | base | small | medium | large-v3
ASR_MODE=whisper                         # whisper | vosk
TTS_ENGINE=gtts                          # gtts | coqui
TTS_LANGUAGE=fr

# ========================================
# RAG Pipeline
# ========================================
CHUNK_SIZE=500
CHUNK_OVERLAP=50
TOP_K_RETRIEVAL=5
MIN_RELEVANCE_SCORE=0.65
FALLBACK_THRESHOLD=0.40
```

---

## 📖 Utilisation

### Interface Étudiant

1. **Mode Texte** : Saisir une question dans la zone de texte et appuyer sur Entrée
2. **Mode Vocal** : Cliquer sur le bouton microphone 🎙️, poser votre question oralement, relâcher
3. **Consultation Sources** : Chaque réponse affiche les documents sources cités
4. **Historique** : L'historique de conversation est maintenu durant la session

### Interface Administrateur

Accès via `/admin` avec les identifiants fournis par l'administrateur système.

- **Gestion Documents** : Upload, modification et suppression de documents dans la base de connaissances
- **Consultation Logs** : Visualisation des conversations et identification des questions sans réponse satisfaisante
- **Statistiques** : Taux de résolution, questions fréquentes, satisfaction utilisateur

### Ingestion de Nouveaux Documents

```bash
# Ajouter un document PDF à la base de connaissances
python scripts/ingest_documents.py \
  --file /path/to/document.pdf \
  --category "reglements" \
  --title "Règlement des études 2025-2026"

# Réindexer toute la base de connaissances
python scripts/ingest_documents.py --reindex-all
```

---

## 📚 Documentation Technique

La documentation complète est disponible dans le répertoire `/docs/` :

| Document | Contenu |
|---|---|
| [`01_architecture.md`](docs/01_architecture.md) | Diagrammes d'architecture, flux de données, décisions techniques |
| [`02_rag_pipeline.md`](docs/02_rag_pipeline.md) | Pipeline RAG détaillé : embedding, retrieval, prompt engineering, génération |
| [`03_voice_integration.md`](docs/03_voice_integration.md) | Intégration ASR/TTS, benchmarks Whisper vs Vosk, gTTS vs Coqui |
| [`04_admin_guide.md`](docs/04_admin_guide.md) | Guide d'administration non-technique : gestion KB, consultation logs |
| [`05_evaluation_methodology.md`](docs/05_evaluation_methodology.md) | Protocole d'évaluation : MRR@5, BLEU, SUS, Likert |
| [`06_deployment.md`](docs/06_deployment.md) | Guide de déploiement production sur serveur ESPA |

---

## 🧪 Tests & Évaluation

### Tests Unitaires et d'Intégration

```bash
cd backend

# Tous les tests
pytest tests/ -v

# Uniquement les tests unitaires
pytest tests/unit/ -v

# Avec couverture de code
pytest tests/ --cov=app --cov-report=html
```

### Évaluation du Moteur NLP (MRR@5)

```bash
# Lancer l'évaluation sur les 100 questions de référence
python tests/evaluation/eval_100_questions.py \
  --questions tests/evaluation/questions_test.json \
  --output results/evaluation_$(date +%Y%m%d).json

# Afficher le rapport
python tests/evaluation/eval_100_questions.py --report results/evaluation_*.json
```

### Métriques Cibles

| Métrique | Objectif | Description |
|---|---|---|
| **MRR@5** | ≥ 0.75 | Mean Reciprocal Rank sur 100 questions test |
| **Taux de résolution** | ≥ 80% | Questions répondues sans intervention humaine |
| **SUS (System Usability Scale)** | ≥ 70/100 | Score de satisfaction utilisateur |
| **Latence réponse texte** | ≤ 3 s | Temps de réponse API (P95) |
| **Latence ASR** | ≤ 2 s | Transcription vocale (P95) |

---

## 🌐 Déploiement en Production

### Déploiement sur Serveur ESPA

```bash
# Sur le serveur de production
git clone https://github.com/espa-antsiranana/unibot-espa.git
cd unibot-espa

# Configurer l'environnement de production
cp .env.example .env.prod
nano .env.prod  # Renseigner toutes les valeurs de production

# Déployer avec la configuration production
docker compose -f docker-compose.prod.yml up -d --build

# Vérifier l'état des services
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

### Configuration HTTPS (Certificat Auto-signé ESPA)

```bash
# Générer un certificat auto-signé
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=MG/ST=Antsiranana/O=ESPA/CN=unibot.espa.mg"

# Copier les certificats dans le volume nginx
docker compose -f docker-compose.prod.yml restart nginx
```

---

## 🤝 Contribution

Ce projet est développé dans le cadre d'un PFE académique. Les contributions sont les bienvenues après soutenance.

### Workflow de Développement

```bash
# Créer une branche de fonctionnalité
git checkout -b feature/nom-de-la-fonctionnalite

# Commits avec messages conventionnels
git commit -m "feat(rag): amélioration du chunking sémantique"
git commit -m "fix(asr): correction latence Whisper sur audio long"
git commit -m "docs(readme): mise à jour section déploiement"

# Pousser et ouvrir une Pull Request
git push origin feature/nom-de-la-fonctionnalite
```

---
