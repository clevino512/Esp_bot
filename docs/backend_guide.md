# UniBot ESPA — Backend Guide

Complete guide for setting up, running, and testing the UniBot ESPA backend API.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Running the Application](#running-the-application)
5. [API Endpoints](#api-endpoints)
6. [Testing Guide](#testing-guide)
7. [Document Ingestion](#document-ingestion)
8. [Configuration Reference](#configuration-reference)

---

## Architecture Overview

```
backend/
├── main.py                 # FastAPI application entry point
├── app/
│   ├── config/             # Settings and configuration
│   │   ├── settings.py     # Pydantic settings from .env
│   │   └── constants.py    # Application constants
│   ├── models/             # Pydantic request/response models
│   ├── db/                 # Database layer (SQLAlchemy)
│   │   ├── models.py       # ORM models
│   │   ├── session.py      # Database connection
│   │   └── repositories/   # Data access layer
│   ├── core/               # RAG pipeline components
│   │   ├── embedder.py     # Sentence transformers embeddings
│   │   ├── retriever.py    # ChromaDB vector search
│   │   ├── llm_client.py   # OpenAI/Ollama integration
│   │   ├── fallback.py     # Fallback handler
│   │   └── prompts.py      # Prompt templates
│   ├── voice/              # Voice processing (ASR/TTS)
│   ├── knowledge/          # Document processing
│   ├── services/           # Business logic layer
│   ├── routes/             # API route handlers
│   └── middleware/         # Request/response middleware
└── scripts/                # Utility scripts
    ├── init_db.sql         # Database initialization
    ├── ingest_documents.py # Document ingestion
    └── evaluate_rag.py     # RAG evaluation
```

## Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- ChromaDB
- OpenAI API key (or Ollama for local LLM)

## Environment Setup

### 1. Create `.env` file

```bash
# App
APP_ENV=development
APP_NAME=UniBot ESPA
APP_VERSION=1.0.0
DEBUG=true

# LLM (choose one)
LLM_PROVIDER=openai  # or "ollama"
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-4o-mini
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b

# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=unibot
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/unibot

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-secret-key-here-use-openssl-rand-hex-32
ALGORITHM=HS256

# Admin
ADMIN_EMAIL=admin@espa.mg
ADMIN_DEFAULT_PASSWORD=admin123
```

### 2. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Initialize Database

```bash
# Option 1: Using SQL script
psql -U postgres -d unibot -f scripts/init_db.sql

# Option 2: Using SQLAlchemy auto-create
# Tables are created automatically on startup
```

## Running the Application

### Development Mode

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
gunicorn main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 120
```

### Docker

```bash
docker-compose up -d
```

The API will be available at `http://localhost:8000`

- API Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login and get JWT token |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user info |
| POST | `/api/v1/auth/logout` | Logout |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat/message` | Send a message |
| GET | `/api/v1/chat/history/{session_id}` | Get conversation history |
| POST | `/api/v1/chat/feedback` | Submit message feedback |
| DELETE | `/api/v1/chat/conversation/{session_id}` | Clear conversation |

### Voice

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/voice/transcribe` | Transcribe audio file |
| POST | `/api/v1/voice/synthesize` | Synthesize speech from text |
| POST | `/api/v1/voice/chat` | Voice-to-voice chat |

### Admin (requires admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/dashboard` | Dashboard statistics |
| GET | `/api/v1/admin/conversations` | Conversation logs |
| GET | `/api/v1/admin/fallback-questions` | Fallback question analysis |
| GET | `/api/v1/admin/documents` | List documents |
| POST | `/api/v1/admin/documents/upload` | Upload document |
| DELETE | `/api/v1/admin/documents/{id}` | Delete document |
| POST | `/api/v1/admin/documents/{id}/reindex` | Reindex document |

## Testing Guide

### 1. Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "1.0.0"
}
```

### 2. Register a User

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@espa.mg",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@espa.mg",
    "password": "admin123"
  }'
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 4. Send a Chat Message

```bash
TOKEN="your-access-token"

curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Quelles sont les dates dinscription ?",
    "session_id": "test-session-1"
  }'
```

Response:
```json
{
  "id": "uuid",
  "response": "Les dates d'inscription sont...",
  "sources": [
    {
      "document_id": 1,
      "document_title": "Guide d'inscription",
      "chunk_index": 0,
      "content": "...",
      "relevance_score": 0.85
    }
  ],
  "session_id": "test-session-1",
  "confidence": 0.85,
  "is_fallback": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 5. Upload a Document (Admin)

```bash
curl -X POST http://localhost:8000/api/v1/admin/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf" \
  -F "title=Guide d'inscription" \
  -F "category=inscription"
```

### 6. Test Voice Transcription

```bash
curl -X POST http://localhost:8000/api/v1/voice/transcribe \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio=@recording.wav" \
  -F "language=fr"
```

### Using Python

```python
import httpx

BASE_URL = "http://localhost:8000/api/v1"

# Login
response = httpx.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@espa.mg",
    "password": "admin123"
})
token = response.json()["access_token"]

headers = {"Authorization": f"Bearer {token}"}

# Send chat message
response = httpx.post(
    f"{BASE_URL}/chat/message",
    headers=headers,
    json={
        "message": "Comment obtenir mon releve de notes ?",
        "session_id": "test-session"
    }
)
print(response.json())
```

## Document Ingestion

### 1. Prepare Documents

Place your documents in a directory:
```
documents/
├── guide_inscription.pdf
├── reglement_interieur.pdf
├── calendrier_examens.docx
└── faq.txt
```

### 2. Run Ingestion Script

```bash
cd backend
python scripts/ingest_documents.py \
    --dir /path/to/documents \
    --category general \
    --test "Quelles sont les dates d'inscription ?"
```

### 3. Category Options

- `admission` - Admission documents
- `inscription` - Registration documents
- `examens` - Exam information
- `notes` - Grades and transcripts
- `boursers` - Scholarships
- `stages` - Internships
- `diplomes` - Diplomas
- `emploi_du_temps` - Schedules
- `reglement` - Rules and regulations
- `general` - General information

## Configuration Reference

### LLM Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `LLM_PROVIDER` | `openai` | LLM provider (openai/ollama) |
| `OPENAI_API_KEY` | - | OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model to use |
| `OPENAI_MAX_TOKENS` | `1000` | Max response tokens |
| `OPENAI_TEMPERATURE` | `0.2` | Response randomness |

### RAG Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `CHUNK_SIZE` | `500` | Document chunk size |
| `CHUNK_OVERLAP` | `50` | Chunk overlap chars |
| `TOP_K_RETRIEVAL` | `5` | Number of sources |
| `MIN_RELEVANCE_SCORE` | `0.65` | Minimum relevance |
| `FALLBACK_THRESHOLD` | `0.40` | Fallback trigger |

### Database Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `DATABASE_URL` | - | PostgreSQL connection URL |
| `REDIS_URL` | - | Redis connection URL |
| `SESSION_TTL_SECONDS` | `3600` | Session timeout |

### Security Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `SECRET_KEY` | - | JWT signing key |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token expiry |
| `RATE_LIMIT_PER_MINUTE` | `30` | API rate limit |

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -U postgres -d unibot -c "SELECT 1"
```

### ChromaDB Connection Failed

```bash
# Check ChromaDB is running
curl http://localhost:8000/api/v1/health

# Restart ChromaDB
docker restart chromadb
```

### Model Loading Issues

```bash
# Clear model cache
rm -rf ~/.cache/huggingface

# Download models manually
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"
```

### Memory Issues with Large Documents

Reduce chunk size and batch processing:

```bash
python scripts/ingest_documents.py \
    --dir /path/to/documents \
    --batch-size 5
```

## Production Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      target: production
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=production
      - DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/unibot
    depends_on:
      - postgres
      - redis
      - chromadb

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: unibot
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chroma_data:/chroma/chroma

volumes:
  postgres_data:
  chroma_data:
```

### Kubernetes

See `k8s/` directory for Kubernetes deployment manifests.
