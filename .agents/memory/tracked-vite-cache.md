---
name: Tracked Vite cache
description: Comportement du cache de dépendances Vite suivi par Git dans ce projet
---

Le redémarrage du workflow frontend peut régénérer les fichiers optimisés dans `node_modules/.vite/deps`, même après un build réussi, et laisser l’arbre Git sale.

**Why:** Le workflow Vite réoptimise les dépendances lorsqu’il détecte un changement du lockfile ou de son cache, alors que ces fichiers sont suivis dans le dépôt.

**How to apply:** Après un redémarrage ou un build, vérifier `git status`. Si seules les dépendances optimisées Vite ont changé, les restaurer avant de livrer ; ne pas les inclure dans un commit fonctionnel.