import api from '@/lib/api'

export const SUS_QUESTIONS = [
  { id: 1, text: "Je pense que j'utiliserais cet assistant régulièrement.", positive: true },
  { id: 2, text: "J'ai trouvé cet assistant inutilement complexe.", positive: false },
  { id: 3, text: "J'ai trouvé cet assistant facile à utiliser.", positive: true },
  { id: 4, text: "Je pense que j'aurais besoin d'aide pour utiliser cet assistant.", positive: false },
  { id: 5, text: "Les différentes fonctions de cet assistant m'ont semblé bien intégrées.", positive: true },
  { id: 6, text: "J'ai trouvé trop d'incohérences dans cet assistant.", positive: false },
  { id: 7, text: "La plupart des gens apprendraient à utiliser cet assistant très rapidement.", positive: true },
  { id: 8, text: "J'ai trouvé cet assistant très difficile à utiliser.", positive: false },
  { id: 9, text: "Je me suis senti confiant en utilisant cet assistant.", positive: true },
  { id: 10, text: "J'avais besoin d'apprendre beaucoup de choses avant de pouvoir utiliser cet assistant.", positive: false },
] as const

export type SUSResponses = Record<number, number>

export function calculateSUSScore(responses: SUSResponses): number {
  let total = 0
  SUS_QUESTIONS.forEach(q => {
    const r = responses[q.id] ?? 3
    total += q.positive ? r - 1 : 5 - r
  })
  return total * 2.5
}

export function getSUSGrade(score: number): {
  grade: string
  label: string
  color: string
  description: string
} {
  if (score >= 90)
    return { grade: 'A', label: 'Excellent', color: 'text-success-600', description: 'Meilleur que 96% des systèmes évalués.' }
  if (score >= 80)
    return { grade: 'B', label: 'Bon', color: 'text-primary-600', description: 'Meilleur que 72% des systèmes évalués.' }
  if (score >= 68)
    return { grade: 'C', label: 'Acceptable', color: 'text-sky-600', description: 'Au-dessus de la moyenne (score moyen : 68).' }
  if (score >= 51)
    return { grade: 'D', label: 'Médiocre', color: 'text-warning-600', description: 'En dessous de la moyenne. Des améliorations sont nécessaires.' }
  return { grade: 'F', label: 'Inacceptable', color: 'text-error-600', description: 'Score critique. Refonte de l\'expérience utilisateur recommandée.' }
}

export interface SUSStats {
  count: number
  avgScore: number
  minScore: number
  maxScore: number
  distribution: { range: string; count: number; min: number; max: number }[]
  recentScores: { score: number; timestamp: string }[]
}

export async function submitSUSFeedback(payload: {
  sessionId: string
  responses: SUSResponses
  score: number
}): Promise<void> {
  await api.post('/chat/sus-feedback', {
    session_id: payload.sessionId,
    responses: payload.responses,
    score: payload.score,
  })
}

export async function getSUSStats(): Promise<SUSStats> {
  const response = await api.get<SUSStats>('/admin/sus-stats')
  return response.data
}
