---
name: HMR hooks count
description: Ajouter ou retirer des hooks dans un fichier existant déclenche des erreurs React pendant HMR
---

## Règle

Quand on ajoute/supprime des hooks (`useState`, `useRef`, `useEffect`, `useCallback`) dans un fichier importé par un composant React, le hot-module-replace (HMR) de Vite génère l'erreur :
> "React has detected a change in the order of Hooks called"
> "Should have a queue. This is likely a bug in React."

Ce n'est pas un vrai bug — c'est HMR qui ne peut pas gérer les changements de nombre/ordre de hooks. **L'app fonctionne correctement après un full reload** (restart du workflow).

**Why:** React identifie les hooks par leur position dans l'arbre d'appel. HMR réutilise l'état existant mais le nombre de hooks a changé → incohérence.

**How to apply:** Après avoir ajouté des hooks dans un fichier existant, toujours redémarrer le workflow (WorkflowsRestart) pour obtenir un état propre. Ne pas s'alarmer si l'erreur apparaît uniquement au moment du HMR update.
