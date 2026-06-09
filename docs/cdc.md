# Perimetre Phase 1 – Base de Connaissances & Moteur NLP

## Objectif
Définir et implémenter le périmètre fonctionnel du **Phase 1** du projet UniBot ESPA, centré sur la construction de la base de connaissances (KB) et le moteur de traitement du langage naturel (NLP) en mode RAG (Retrieval‑Augmented Generation).

## Scope détaillé

| Domaine | Tâches incluses | Livrables |
|--------|----------------|-----------|
| **Revue bibliographique** | • Étude des architectures RAG existantes (Stanford OHS, Georgia Tech Jill Watson, UniBOT).<br>• Analyse des benchmarks et des bonnes pratiques. | • Rapport de revue (markdown) avec matrice de comparaison. |
| **Collecte des documents** | • Extraction des documents institutionnels ESPA (règlements, calendriers, FAQ, procédures, guides).<br>• Conversion PDF → texte brut. | • Répertoire `knowledge-base/raw/` peuplé des sources brutes. |
| **Pré‑traitement** | • Nettoyage (suppression des métadonnées, normalisation Unicode).<br>• Chunking sémantique (~500 tokens + overlap).<br>• Étiquetage des catégories (ex. « admission », « examen », « ressources »). | • Répertoire `knowledge-base/processed/` avec chunks vectorisés. |
| **Indexation vectorielle** | • Génération d’embeddings avec `sentence-transformers` (multilingual‑MiniLM‑L12‑v2).<br>• Construction d’index FAISS et persistance dans ChromaDB. | • Index FAISS + métadonnées stockées dans `ChromaDB/`. |
| **Pipeline RAG** | • Implémentation avec LangChain :<br> - Retriever (FAISS/ChromaDB).<br> - Prompt engineering (template + few‑shot).<br> - LLM (GPT‑4o ou Mistral 7B via Ollama).<br> - Post‑traitement (filtre de confiance, fallback). | • Module Python `rag_pipeline/` avec fonctions `retrieve()`, `generate()`, `fallback()`. |
| **Évaluation** | • Création d’un jeu de 100 questions‑réponses de test.<br>• Métriques : MRR@5, précision, taux de “no‑answer”.<br>• Analyse des erreurs et itération. | • Rapport d’évaluation (`evaluation/phase1_metrics.md`). |
| **Fallback & détection hors‑domaine** | • Implémentation d’un détecteur de domaine (ex. similarité sémantique < threshold).<br>• Redirection vers un canal humain (email, ticket). | • Composant `fallback/` avec logique de détection. |
| **Documentation** | • Rédaction du périmètre Phase 1 dans `PLAN_ACTION_PFE.md`.<br>• Ajout de schémas d’architecture (diagramme RAG). | • Documents markdown dans `docs/`. |

## Planning prévisionnel (sprints de 2 semaines)

| Sprint | Durée | Objectifs clés |
|-------|-------|----------------|
| **Sprint 1** | 2 semaines | Revue bibliographique + collecte des documents. |
| **Sprint 2** | 2 semaines | Pré‑traitement & chunking, génération d’embeddings. |
| **Sprint 3** | 2 semaines | Construction de l’index FAISS/ChromaDB. |
| **Sprint 4** | 2 semaines | Implémentation du pipeline RAG (retrieve + generate). |
| **Sprint 5** | 1 semaine | Évaluation, ajustement des prompts, fallback. |
| **Sprint 6** | 1 semaine | Rédaction documentation & préparation du rapport. |

## Ressources nécessaires
- **Matériel** : Serveur Ubuntu 22.04 (ESPA) avec GPU (optionnel) ou CPU uniquement (embeddings légers).  
- **Logiciels** : Python 3.11, Docker Compose, FastAPI, LangChain, sentence‑transformers, FAISS, ChromaDB, PostgreSQL, Redis.  
- **Données** : Accès aux documents PDF/Word de l’ESPA (via le drive partagé).  

## Constraints spécifiques à Phase 1
1. **Volume de données** : Limité à ~10 GB de texte brut pour rester dans les capacités de la VM de test.  
2. **Exactitude du chunking** : Overlap de 10 % recommandé pour préserver le contexte entre chunks.  
3. **Réutilisabilité** : Tous les scripts doivent être versionnés dans le répertoire `scripts/phase1/`.  
4. **Traçabilité** : Chaque étape doit être journalisée dans le `Makefile` (cible `phase1`).  

## Risques & Mitigations
| Risque | Impact | Mitigation |
|--------|--------|------------|
| PDF de mauvaise qualité (scans) | Perte d’information → mauvaise retrieval | Utiliser OCR (Tesseract) avec langue française/malgache; nettoyer les artefacts. |
| Dépassement de capacité d’embeddings | Ralentissement du pipeline | Utiliser des modèles plus légers (`all-MiniLM-L6-v2`) pour le prototypage. |
| Faible couverture du jeu de test | Évaluation biaisée | Impliquer des étudiants dès le Sprint 1 pour générer des questions réalistes. |
| Dépendance à un LLM externe (GPT‑4o) | Coût & confidentialité | Prévoir un modèle open‑source (Mistral 7B) comme alternative. |

---

*Ce document définit le périmètre fonctionnel et organisationnel du **Phase 1**. Les livrables listés constituent la base sur laquelle seront construites les fonctionnalités vocales et l’interface utilisateur du **Phase 2**.*

# Installation de l’environnement Phase 1

## Prérequis système
```bash
# Mise à jour des paquets
sudo apt update && sudo apt upgrade -y

# Outils système nécessaires
sudo apt install -y docker.io docker-compose python3-pip git make gcc g++ python3-dev
sudo apt install -y tesseract-ocr poppler-utils ffmpeg libportaudio2

# Node.js (optionnel, pour le front React)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs
```

## Prérequis Python
```bash
# Créer un environnement virtuel (recommandé)
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances Python
pip install --upgrade pip
pip install -r requirements.txt
```

## Initialisation des services Docker
```bash
# Démarrer les conteneurs définis dans docker-compose.yml
docker-compose up -d

# Vérifier que les conteneurs sont en cours d'exécution
docker-compose ps
```

## Étapes supplémentaires
- **Base de données** : créer les tables PostgreSQL via le script `scripts/init_db.py`.
- **Index vectoriel** : lancer le script d'indexation `scripts/build_index.py` pour charger les chunks depuis `knowledge-base/processed/` dans ChromaDB/FAISS.
- **Tests** : exécuter la suite de tests avec `make test` ou `pytest`.

> **Note** : Toutes les commandes ci‑dessus doivent être exécutées depuis la racine du projet (`Esp_bot`). Consultez le `Makefile` pour des raccourcis supplémentaires (`make phase1`, `make lint`, etc.).