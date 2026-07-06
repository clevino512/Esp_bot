---
name: API base URL
description: Frontend doit utiliser une URL relative pour l'API, pas localhost hardcodé
---

Le frontend doit appeler le backend via `/api/v1` (URL relative), pas `http://localhost:8000/api/v1`.

**Why:** Sur Replit le preview est un iframe proxifié — `localhost` n'est pas accessible depuis le navigateur. Vite proxifie `/api` → `localhost:8000` côté serveur. En production, même origin = URL relative.

**How to apply:** Dans `frontend/src/lib/api.ts`, le fallback doit être `/api/v1`. `VITE_API_URL` peut surcharger pour un backend distant.
