---
name: SQLAlchemy text() row access
description: Comment accéder aux colonnes retournées par text() + execute() en SQLAlchemy async
---

Avec `await db.execute(text("SELECT ..."), params)` :
- `.mappings()` retourne des objets dict-like → accès par clé : `row["col_name"]`
- `.all()` sans `.mappings()` retourne des Row objects → accès par attribut : `row.col_name`
- Mélanger les deux (`row.col` sur un mapping) lève une AttributeError à l'exécution.

**Why:** Découvert lors de la correction de `get_top_questions` qui utilisait `.mappings()` puis `row.content`.

**How to apply:** Choisir l'un ou l'autre et être cohérent. `.mappings()` + clé est plus explicite et évite les collisions de noms.
