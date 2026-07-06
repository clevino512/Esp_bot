---
name: useChat history pattern
description: Pattern pour passer l'historique de conversation au backend LLM sans stale closure dans useCallback
---

## Règle

Dans `useChat.ts`, les callbacks `sendTextMessage` / `sendVoiceMessage` ont besoin de lire `messages` (état React) mais ne peuvent pas le mettre dans leurs dépendances sans recréer la fonction à chaque message — ce qui cause des re-renders inutiles.

**Solution : `useRef` + `useEffect` pour suivre la valeur courante**

```ts
const messagesRef = useRef(messages)
useEffect(() => {
  messagesRef.current = messages
})  // pas de deps : synchronise à chaque render

// Dans sendTextMessage, utiliser messagesRef.current
const historySnapshot = buildHistory([...messagesRef.current, userMsg])
```

**Why:** `useCallback` avec `messages` en dep recrée la fonction sur chaque message → re-render de tous les enfants qui reçoivent ce callback. Le ref pattern donne toujours la valeur fraîche sans dépendance.

**How to apply:** Toujours utiliser ce pattern quand un `useCallback` a besoin de lire un état mais est stable (ne doit pas changer d'identité souvent).
