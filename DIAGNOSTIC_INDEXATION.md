# 🔧 DIAGNOSTIC & SOLUTIONS: Problèmes d'Indexation de Documents

## 📋 Résumé Exécutif

**Problème principal:** Les documents uploadés ne sont pas retrouvés par le système de RAG, ce qui génère constamment des réponses "hors domaine".

**Cause racine:** Une configuration de seuils de pertinence trop stricte qui **rejette les documents valides**.

**Solution:** Réajuster les paramètres de récupération et améliorer la logique du fallback.

---

## 🔴 LES 4 PROBLÈMES CRITIQUES

### ❌ Problème #1: MIN_RELEVANCE_SCORE Trop Élevé (0.65)

**Où:** `backend/app/config/settings.py` ligne 48

**Qu'est-ce que c'est:**
- Score de pertinence minimum accepté par le retriever
- Utilise la distance cosinus entre l'embedding de la requête et les documents
- Valeur entre 0 (pas de match) et 1 (match parfait)

**Pourquoi c'est un problème:**
```
Scénario réel:
├─ Utilisateur demande: "comment obtenir un relevé de notes?"
├─ Document trouvé: releve_notes_procedure.txt
├─ Score de similarité: 0.60 (très bon match linguistiquement!)
├─ Comparaison: 0.60 < 0.65 (seuil)
├─ Résultat: ❌ REJETÉ - document supprimé avant le LLM
└─ Réponse finale: "Je n'ai pas l'information... Contactez la scolarité"
```

**Impact:**
- Documents pertinents à 50-65% sont **systématiquement rejetés**
- Le retriever retourne zéro source
- Le fallback handler déclenche une réponse "hors domaine"

---

### ❌ Problème #2: Configuration Incohérente des Seuils

**Seuils actuels (avant correction):**
```python
MIN_RELEVANCE_SCORE: 0.65      # Retriever (trop strict)
FALLBACK_THRESHOLD: 0.40        # Fallback handler (trop permissif)
TOP_K_RETRIEVAL: 5              # Nombre de documents (insuffisant)
```

**Logique défectueuse:**
```
Plage de pertinence    → Comportement
─────────────────────────────────────────
0.00 - 0.39            → Rejeté 2 fois ❌
0.40 - 0.64            → Zone grise 🟡 PERDU
0.65 - 1.00            → Accepté ✅
```

Les documents entre 0.40 et 0.64 **créent une zone ambiguë** où:
- Le retriever les rejette (< 0.65)
- Le fallback handler ignore les sources vides
- Résultat: Réponse "hors domaine"

---

### ❌ Problème #3: Logique Défectueuse dans ChatService

**Fichier:** `backend/app/services/chat_service.py` ligne 47

**Code problématique:**
```python
sources = await self.retriever.aretrieve(user_message)
# ⚠️ sources = [] si tous les documents ont 0.40-0.64 de pertinence
is_fallback = self.fallback.should_fallback(sources)
# ⚠️ True car sources est vide, même si des documents pertinents existent!
```

**Problème:**
- Le retriever **filtre déjà les sources par MIN_RELEVANCE_SCORE**
- Le fallback handler reçoit une liste vide ou incomplète
- Il ne peut pas évaluer correctement la pertinence

---

### ❌ Problème #4: TOP_K_RETRIEVAL Insuffisant (5)

**Fichier:** `backend/app/config/settings.py` ligne 47

**Problème:**
- Avec seuil strict (0.65), récupérer 5 documents peut ne retourner que 2-3 résultats
- Manque de diversité et de contexte
- Augmenter à 8 permet d'avoir plus de sources pour l'agrégation

---

## ✅ SOLUTIONS APPLIQUÉES

### 1️⃣ Réduction des Seuils (Fichier: settings.py)

**AVANT:**
```python
TOP_K_RETRIEVAL: int = 5
MIN_RELEVANCE_SCORE: float = 0.65
FALLBACK_THRESHOLD: float = 0.40
```

**APRÈS:**
```python
TOP_K_RETRIEVAL: int = 8          # +60% de documents
MIN_RELEVANCE_SCORE: float = 0.45 # Accepte plus de pertinence
FALLBACK_THRESHOLD: float = 0.35  # Cohérent avec MIN_RELEVANCE
```

**Impact:**
- Documents à 45%+ de similarité sont maintenant acceptés
- Améliore les cas frontaliers (0.45-0.65)
- Récupère plus de sources pour meilleure agrégation

---

### 2️⃣ Amélioration de la Logique Fallback (Fichier: fallback.py)

**AVANT:**
```python
if max_relevance < self.threshold:
    return True  # Trop simpliste
```

**APRÈS:**
```python
max_relevance = max(s.get("relevance_score", 0) for s in sources)
avg_relevance = sum(s.get("relevance_score", 0) for s in sources) / len(sources)

if max_relevance < self.threshold or avg_relevance < (self.threshold * 0.8):
    return True  # Mieux nuancé
```

**Bénéfices:**
- Utilise la **moyenne** en plus du maximum
- Accepte les sources partiellement pertinentes
- Mieux gérer les domaines avec faible similarité moyenne

---

### 3️⃣ Logging Détaillé & Contexte Partiel (ChatService)

**Ajouts:**
```python
# Logs détaillés pour déboguer
logger.info(f"Retrieved {len(sources)} sources")
for i, source in enumerate(sources):
    logger.debug(f"Source {i+1}: {source.get('metadata', {}).get('title')}, "
                f"relevance={source.get('relevance_score'):.3f}")

# Utiliser le contexte partiel même en fallback
if context:
    context_text = self.fallback._format_partial_context(context)
    response_text = await self.llm.generate_with_timing(...)
```

**Bénéfices:**
- Traçabilité pour déboguer l'indexation
- Utilise les sources partielles (45-65% pertinence)
- Moins de réponses "hors domaine"

---

## 📊 EXEMPLE DE CAS D'USAGE CORRIGÉ

### Avant (PROBLÈME):
```
User: "Quels sont les procédures de demande de relevé de note?"

1. Retriever cherche document
2. Trouve "releve_notes_procedure.txt" avec score 0.58
3. Score 0.58 < MIN_RELEVANCE (0.65) → ❌ REJETÉ
4. sources = []
5. should_fallback([]) → True
6. Réponse: "Je n'ai pas l'information... Contactez la scolarité"
```

### Après (SOLUTION):
```
User: "Quels sont les procédures de demande de relevé de note?"

1. Retriever cherche document
2. Trouve "releve_notes_procedure.txt" avec score 0.58
3. Score 0.58 >= MIN_RELEVANCE (0.45) → ✅ ACCEPTÉ
4. sources = [{...,"relevance": 0.58}]
5. should_fallback(sources) → False (max > 0.35)
6. Réponse: "Voici la procédure: 
   - Étape 1: Retrait du formulaire...
   - Étape 2: Constitution du dossier..."
```

---

## 🚀 COMMENT TESTER LES CORRECTIONS

### Option 1: Script de Diagnostic (Recommandé)

```bash
cd backend
python scripts/diagnose_indexation.py
```

Ce script va:
- ✅ Vérifier la connexion ChromaDB
- ✅ Tester 6 requêtes de diagnostic
- ✅ Analyser la distribution des scores
- ✅ Identifier les documents mal indexés

### Option 2: Test Manuel via API

```bash
# 1. Redémarrer le backend
docker-compose up --build backend

# 2. Tester via l'interface
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "relevé de notes procedure"}'

# 3. Vérifier les logs
docker-compose logs -f backend | grep "Retrieved\|relevance"
```

### Option 3: Vérifier dans la Base de Données

```bash
# Connexion à ChromaDB
docker exec chromadb chromadb-cli list-collections

# Compter les documents indexés
SELECT COUNT(*) FROM documents;
```

---

## ⚙️ PARAMÈTRES RECOMMANDÉS PAR CAS D'USAGE

### Pour une Base de Connaissances Petite (<50 docs)
```python
MIN_RELEVANCE_SCORE: 0.50  # Plus permissif
FALLBACK_THRESHOLD: 0.40
TOP_K_RETRIEVAL: 8
```

### Pour une Base de Connaissances Moyenne (50-500 docs)
```python
MIN_RELEVANCE_SCORE: 0.45  # ⭐ Recommandé (actuellement utilisé)
FALLBACK_THRESHOLD: 0.35
TOP_K_RETRIEVAL: 8
```

### Pour une Base de Connaissances Grande (>500 docs)
```python
MIN_RELEVANCE_SCORE: 0.50  # Augmenter pour éviter faux positifs
FALLBACK_THRESHOLD: 0.40
TOP_K_RETRIEVAL: 10
```

---

## 📌 CHECKLIST POST-DÉPLOIEMENT

- [ ] Redémarrer le backend: `docker-compose down && docker-compose up -d backend`
- [ ] Exécuter le diagnostic: `python scripts/diagnose_indexation.py`
- [ ] Tester 5 requêtes depuis l'interface utilisateur
- [ ] Vérifier les logs: `docker-compose logs -f backend | grep "Retrieved"`
- [ ] Comparer les résultats **avant/après**
- [ ] Ajuster les seuils si nécessaire selon les résultats

---

## 🔍 DÉBOGAGE AVANCÉ

### Si "Hors domaine" persiste:

1. **Vérifier l'indexation des documents:**
   ```bash
   python scripts/diagnose_indexation.py
   ```

2. **Augmenter MIN_RELEVANCE_SCORE progressivement:**
   ```python
   # Essayer 0.40
   MIN_RELEVANCE_SCORE: float = 0.40
   # Puis réduire graduellement selon les résultats
   ```

3. **Vérifier le modèle d'embedding:**
   - Modèle actuel: `paraphrase-multilingual-MiniLM-L12-v2`
   - Bon pour: Multilingue, rapide, équilibré
   - Considérer si mauvais: Passer à `all-mpnet-base-v2` (meilleur, plus lent)

4. **Analyser les logs détaillés:**
   ```bash
   docker-compose logs -f backend | grep -E "relevance|Retrieved|Fallback"
   ```

---

## 📚 RESSOURCES

- **Documentation ChromaDB:** https://docs.trychroma.com/
- **Similarité Cosinus:** https://en.wikipedia.org/wiki/Cosine_similarity
- **Models Hugging Face:** https://huggingface.co/sentence-transformers

---

## 💡 NOTES IMPORTANTES

1. **Min_relevance_score vs fallback_threshold:**
   - `MIN_RELEVANCE_SCORE` = Filtre du retriever (stricte)
   - `FALLBACK_THRESHOLD` = Décision du fallback (permissif)
   - Doivent être **cohérents** (min > fallback)

2. **Pourquoi 0.45 et pas 0.50?**
   - 0.45 capture les matches partiels
   - 0.50 est trop strict pour domaines spécialisés
   - 0.40 est trop permissif (beaucoup de faux positifs)

3. **TOP_K vs MIN_RELEVANCE:**
   - TOP_K = nombre maximal de documents à récupérer
   - MIN_RELEVANCE = filtre de qualité
   - Tous les documents retournés doivent passer le filtre de qualité

---

**Dernière mise à jour:** 2024-12-15  
**Auteur:** Expert en Python/RAG  
**Version:** 1.1
