# =============================================================
# UniBot ESPA — Makefile
# Commandes raccourcis pour le développement et déploiement
# Usage : make <commande>
# =============================================================

.PHONY: help dev build test clean logs shell ingest eval deploy

# Couleurs terminal
GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
RESET  := \033[0m

help: ## Afficher l'aide
	@echo ""
	@echo "$(CYAN)╔═══════════════════════════════════════════╗$(RESET)"
	@echo "$(CYAN)║        UniBot ESPA — Commandes Make       ║$(RESET)"
	@echo "$(CYAN)╚═══════════════════════════════════════════╝$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# -------------------------------------------------------
# DÉVELOPPEMENT
# -------------------------------------------------------

dev: ## Démarrer l'environnement de développement complet
	@echo "$(YELLOW)Démarrage UniBot ESPA (mode développement)...$(RESET)"
	@cp -n .env.example .env 2>/dev/null || true
	docker compose up --build

dev-bg: ## Démarrer en arrière-plan
	docker compose up --build -d
	@echo "$(GREEN)Services démarrés en arrière-plan$(RESET)"
	@echo "  API  : http://localhost:8000/docs"
	@echo "  App  : http://localhost:3000"

dev-offline: ## Démarrer avec mode hors-ligne (Ollama + Vosk)
	docker compose --profile offline up --build

stop: ## Arrêter tous les services
	docker compose down

restart: ## Redémarrer tous les services
	docker compose restart

# -------------------------------------------------------
# CONSTRUCTION
# -------------------------------------------------------

build: ## Construire toutes les images Docker
	docker compose build --no-cache

build-backend: ## Reconstruire uniquement le backend
	docker compose build --no-cache backend

build-frontend: ## Reconstruire uniquement le frontend
	docker compose build --no-cache frontend

# -------------------------------------------------------
# BASE DE DONNÉES & DONNÉES
# -------------------------------------------------------

db-init: ## Initialiser le schéma de la base de données
	docker compose exec backend python -m alembic upgrade head
	@echo "$(GREEN)Base de données initialisée$(RESET)"

db-migrate: ## Créer une nouvelle migration Alembic
	@read -p "Nom de la migration : " name; \
	docker compose exec backend python -m alembic revision --autogenerate -m "$$name"

db-reset: ## Réinitialiser la base de données (DANGER)
	@echo "$(YELLOW)⚠️  Cette action supprime toutes les données. Confirmer ? [y/N]$(RESET)"
	@read confirm; [ "$$confirm" = "y" ] && docker compose down -v && docker compose up -d postgres && sleep 5 && make db-init

ingest: ## Ingérer les documents dans la base de connaissances
	@echo "$(YELLOW)Ingestion des documents ESPA...$(RESET)"
	docker compose exec backend python scripts/ingest_documents.py --source /app/knowledge-base/raw/
	@echo "$(GREEN)Ingestion terminée$(RESET)"

ingest-file: ## Ingérer un fichier spécifique (usage: make ingest-file FILE=doc.pdf CAT=reglements)
	docker compose exec backend python scripts/ingest_documents.py \
		--file /app/knowledge-base/raw/$(FILE) \
		--category $(CAT)

reindex: ## Réindexer toute la base de connaissances
	docker compose exec backend python scripts/ingest_documents.py --reindex-all

# -------------------------------------------------------
# TESTS & ÉVALUATION
# -------------------------------------------------------

test: ## Lancer tous les tests
	docker compose exec backend pytest tests/ -v --tb=short

test-unit: ## Tests unitaires uniquement
	docker compose exec backend pytest tests/unit/ -v

test-integration: ## Tests d'intégration
	docker compose exec backend pytest tests/integration/ -v

test-coverage: ## Tests avec rapport de couverture
	docker compose exec backend pytest tests/ --cov=app --cov-report=html
	@echo "$(GREEN)Rapport disponible : backend/htmlcov/index.html$(RESET)"

eval: ## Évaluer le moteur RAG (MRR@5 sur 100 questions)
	@echo "$(YELLOW)Évaluation du moteur NLP RAG...$(RESET)"
	docker compose exec backend python tests/evaluation/eval_100_questions.py \
		--questions tests/evaluation/questions_test.json \
		--output /app/logs/evaluation_$$(date +%Y%m%d_%H%M%S).json

# -------------------------------------------------------
# LOGS & MONITORING
# -------------------------------------------------------

logs: ## Afficher les logs de tous les services
	docker compose logs -f

logs-backend: ## Logs du backend uniquement
	docker compose logs -f backend

logs-errors: ## Afficher uniquement les erreurs
	docker compose logs | grep -i "error\|exception\|critical"

status: ## Vérifier l'état de tous les services
	@echo "$(CYAN)État des services :$(RESET)"
	docker compose ps
	@echo ""
	@echo "$(CYAN)Utilisation ressources :$(RESET)"
	docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# -------------------------------------------------------
# ACCÈS SHELLS
# -------------------------------------------------------

shell-backend: ## Shell dans le container backend
	docker compose exec backend bash

shell-db: ## Shell PostgreSQL
	docker compose exec postgres psql -U $${POSTGRES_USER:-unibot_user} -d $${POSTGRES_DB:-unibot_db}

shell-redis: ## Shell Redis CLI
	docker compose exec redis redis-cli -a $${REDIS_PASSWORD}

# -------------------------------------------------------
# NETTOYAGE
# -------------------------------------------------------

clean: ## Nettoyer containers et images non utilisés
	docker compose down
	docker system prune -f

clean-all: ## Nettoyage complet (DANGER — supprime les volumes)
	@echo "$(YELLOW)⚠️  Cette action supprime TOUTES les données. Confirmer ? [y/N]$(RESET)"
	@read confirm; [ "$$confirm" = "y" ] && docker compose down -v --remove-orphans && docker system prune -af

# -------------------------------------------------------
# DÉPLOIEMENT PRODUCTION
# -------------------------------------------------------

deploy: ## Déployer en production sur le serveur ESPA
	@echo "$(YELLOW)Déploiement en production...$(RESET)"
	docker compose -f docker-compose.prod.yml pull
	docker compose -f docker-compose.prod.yml up --build -d
	docker compose -f docker-compose.prod.yml exec backend python -m alembic upgrade head
	@echo "$(GREEN)Déploiement production terminé$(RESET)"

deploy-status: ## État du déploiement production
	docker compose -f docker-compose.prod.yml ps

backup: ## Sauvegarder la base de données PostgreSQL
	@mkdir -p backups
	docker compose exec postgres pg_dump -U $${POSTGRES_USER} $${POSTGRES_DB} | \
		gzip > backups/unibot_backup_$$(date +%Y%m%d_%H%M%S).sql.gz
	@echo "$(GREEN)Sauvegarde créée dans backups/$(RESET)"
