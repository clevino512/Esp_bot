# ⚡ GUIDE RAPIDE: Vérifier que les Documents Uploadés Fonctionnent

## 🎯 Objectif
Vérifier que les documents uploadés dans `/storage/documents/` sont correctement **indexés** et **vectorisés** pour que vos utilisateurs obtiennent les bonnes réponses.

---

## ✅ CHECKLIST (Faire dans cet ordre)

### Étape 1: Redémarrer le Backend (1-2 min)
```bash
# Terminal dans le répertoire du projet
docker-compose down
docker-compose up -d --build backend

# Vérifier que tout démarre
docker-compose logs -f backend | head -20

# Vous devriez voir:
# ✅ Uvicorn running on http://0.0.0.0:8000
```

**⏱️ Temps:** 1-2 minutes  
**État:** ✅ Fin quand vous voyez "Uvicorn running"

---

### Étape 2: Vérifier l'État Actuel (2-3 min)
```bash
# Exécuter le diagnostic
docker exec -it esp_bot-backend-1 python scripts/diagnose_upload_flow.py
```

**Regardez ces informations clés:**

```
✅ Répertoire storage existe
📊 Fichiers stockés: X
   - DUPLOME...pdf
   - RABENANTENAINA...pdf

📊 Répertoire /app/storage/documents existe: ✅

📊 Documents en base: X
   chunk_count: Y  ← Regardez ce nombre!

📊 Chunks indexés dans ChromaDB: Z
```

**Interprétation:**
- Si `chunk_count: 0` → Les documents ne sont pas encore indexés
- Si `Chunks indexés: 0` → Rien n'est vectorisé
- **→ Passez à l'étape 3 (Migration)**

---

### Étape 3: Migrer et Réindexer (3-5 min)

⚠️ **À faire seulement si l'étape 2 montre `chunk_count: 0`**

```bash
# Exécuter la migration
docker exec -it esp_bot-backend-1 python scripts/migrate_and_reindex.py
```

**Attendez ces lignes:**
```
🔄 MIGRATION ET RÉINDEXATION DES DOCUMENTS

📊 Total de documents en BD: 2

📋 Analyse des documents:
  • DUPLOME SY SARY_1.pdf
    ❌ Chemin invalide | ❌ Non indexé
  • RABENANTENAINA...pdf
    ❌ Chemin invalide | ❌ Non indexé

🔧 ÉTAPE 1: Migration de X document(s)
   ✅ Fichier trouvé
   ✅ Copié vers nouvelle location
   ✅ BD mise à jour

🔍 ÉTAPE 2: Réindexation de X document(s)
   ✅ Fichier chargé: XXXX caractères
   ✅ Indexé: N chunks

✅ SUCCESS! Les documents sont maintenant indexés et vectorisés!
   • Total de chunks indexés: NNN
```

**⏱️ Temps:** 3-5 minutes  
**État:** ✅ Fin quand vous voyez "SUCCESS!"

---

### Étape 4: Vérifier à Nouveau (2 min)

```bash
# Vérifier que tout est OK maintenant
docker exec -it esp_bot-backend-1 python scripts/diagnose_upload_flow.py
```

**Vous devriez voir:**
```
✅ Total de chunks indexés: NNN (au lieu de 0)

Documents:
  chunk_count: NNN (au lieu de 0)
  Fichier existe: ✅ OUI
```

---

### Étape 5: Tester avec une Question (2 min)

#### Option A: Via l'Interface
```
1. Ouvrir: http://localhost:5173
2. Poser une question sur l'un de vos documents:
   - "Qu'est-ce qu'un diplôme?"
   - "Qui est RABENANTENAINA?"
   - Ou autre question liée aux fichiers uploadés

3. Vérifier:
   ✅ Vous obtenez une réponse (pas "Hors domaine")
   ✅ La réponse cite une source
   ✅ La source est vos documents uploadés
```

#### Option B: Via cURL
```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Qu'\''est-ce qu'\''un diplôme?"}'
```

**Résultat attendu:**
```json
{
  "response": "Un diplôme est un document officiel...",
  "sources": [
    {
      "document_title": "DUPLOME SY SARY_1",
      "relevance_score": 0.85,
      "content": "Page 1: Un diplôme est un certificat..."
    }
  ],
  "confidence": 0.85,
  "is_fallback": false
}
```

---

## 🎉 RÉSULTAT FINAL

Quand **TOUT** est ✅, vos documents sont:

| Aspect | État |
|--------|------|
| 📁 Stockés | ✅ `/storage/documents/` |
| 💾 En BD | ✅ Enregistrés avec `chunk_count > 0` |
| 🔍 Indexés | ✅ Chunks dans ChromaDB |
| 🎯 Vectorisés | ✅ Avec embeddings |
| 🚀 Utilisables | ✅ Les utilisateurs obtiennent des réponses pertinentes |

---

## 🆘 TROUBLESHOOTING

### Problème: "Toujours 0 chunks après migration"

**Solution:**
```bash
# 1. Vérifier les fichiers physiques
docker exec -it esp_bot-backend-1 ls -lah /app/storage/documents/

# 2. Vérifier les logs détaillés
docker-compose logs -f backend | grep -E "ERROR|Failed|chunk"

# 3. Vérifier la BD manuellement
docker exec -it esp_bot-postgres-1 psql -U root -d esp_bot -c \
  "SELECT id, title, chunk_count FROM documents;"
```

### Problème: "Migration dit 'SUCCESS' mais toujours pas de résponse"

**Solution:**
1. Attendre 30 secondes (ChromaDB indexation en arrière-plan)
2. Relancer le diagnostic
3. Vérifier les logs: `docker-compose logs backend | tail -50`

### Problème: "Fichiers pas trouvés après migration"

**Solution:**
```bash
# Vérifier que les chemins sont corrects
docker exec -it esp_bot-backend-1 python scripts/migrate_and_reindex.py

# Chercher manuellement
docker exec -it esp_bot-backend-1 bash
find /app/storage -name "*.pdf"
find /app/.cache -name "*.pdf"
```

---

## 📊 AVANT vs APRÈS

### ❌ AVANT (Documents Non Indexés)

```
User: "Qu'est-ce qu'un diplôme?"
     ↓
ChatService recherche...
     ↓
ChromaDB retourne: RIEN ❌ (pas indexé)
     ↓
Fallback Mode: "Je n'ai pas l'information... Contactez la scolarité"
     ↓
User: 😞 Pas satisfait
```

### ✅ APRÈS (Documents Indexés)

```
User: "Qu'est-ce qu'un diplôme?"
     ↓
ChatService recherche...
     ↓
ChromaDB retourne: Document "DUPLOME SY SARY" ✅ (78% pertinence)
     ↓
LLM génère réponse basée sur le document
     ↓
Réponse: "Un diplôme est un document officiel qui atteste..."
         Source: DUPLOME SY SARY_1.pdf
     ↓
User: 🎉 Satisfait!
```

---

## ⏰ TEMPS TOTAL

| Étape | Temps |
|-------|-------|
| 1. Redémarrage | 2 min |
| 2. Diagnostic | 2 min |
| 3. Migration | 5 min |
| 4. Vérif | 2 min |
| 5. Test | 2 min |
| **TOTAL** | **~13 minutes** |

---

## 🎯 SUMMARY

✅ **Documents uploadés** → Stockés dans `/storage/documents/`  
✅ **Indexation** → Chunks créés et numérotés  
✅ **Vectorisation** → Embeddings générés via modèle  
✅ **Récupération** → ChromaDB retrouve les chunks pertinents  
✅ **Réponse** → LLM génère des réponses basées sur les documents  
✅ **Utilisateurs** → Obtiennent des réponses pertinentes!

---

**Pour démarrer:** Exécutez les 5 étapes ci-dessus (environ 13 minutes)

**Questions?** Vérifiez les logs: `docker-compose logs -f backend`
