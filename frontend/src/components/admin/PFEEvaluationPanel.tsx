import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Mic, Target, Clock, ThumbsUp, ClipboardCheck } from 'lucide-react'
import { getPFEEvaluationStats } from '@/services/adminService'
import { StatCard, Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'

export function PFEEvaluationPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['pfe-evaluation', 30],
    queryFn: () => getPFEEvaluationStats(30),
    staleTime: 0,
    refetchInterval: 30_000,
  })

  if (isLoading) return <PageSpinner />
  if (!data) return null

  const pct = (value: number) => `${Math.round(value * 100)}%`

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Évaluation PFE</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Indicateurs calculés à partir des interactions réelles des {data.period_days} derniers jours.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Sessions" value={data.sessions} icon={<MessageSquare className="w-5 h-5" />} color="blue" />
        <StatCard label="Questions vocales" value={data.voice_queries} icon={<Mic className="w-5 h-5" />} color="sky" />
        <StatCard label="Usage vocal" value={pct(data.voice_usage_rate)} icon={<Mic className="w-5 h-5" />} color="green" />
        <StatCard label="Taux de résolution" value={pct(data.resolution_rate)} icon={<Target className="w-5 h-5" />} color="green" />
        <StatCard label="Réponses utiles" value={pct(data.helpful_rate)} icon={<ThumbsUp className="w-5 h-5" />} color="blue" />
        <StatCard label="Temps moyen" value={data.avg_response_time_ms ? `${(data.avg_response_time_ms / 1000).toFixed(1)}s` : 'N/A'} icon={<Clock className="w-5 h-5" />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Préférence de modalité</h3>
          <div className="space-y-4">
            <MetricBar label="Texte" count={data.text_queries} rate={data.text_usage_rate} />
            <MetricBar label="Voix" count={data.voice_queries} rate={data.voice_usage_rate} />
          </div>
          <p className="text-xs text-neutral-400 mt-4">Total : {data.total_queries} questions enregistrées.</p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="w-4 h-4 text-primary-500" />
            <h3 className="font-semibold text-neutral-900 dark:text-white">Pilote et SUS</h3>
          </div>
          <div className="space-y-3 text-sm">
            <Row label="Réponses SUS" value={String(data.sus_response_count)} />
            <Row label="Score SUS moyen" value={data.sus_avg_score == null ? 'À mesurer' : `${data.sus_avg_score.toFixed(1)} / 100`} />
            <Row label="Feedbacks utiles/non utiles" value={String(data.feedback_count)} />
            <Row label="Taux de fallback" value={pct(data.fallback_rate)} />
          </div>
          <p className="text-xs text-neutral-400 mt-4">
            Les valeurs restent descriptives tant que le protocole des 30 étudiants / 4 semaines n'est pas achevé.
          </p>
        </Card>
      </div>
    </div>
  )
}

function MetricBar({ label, count, rate }: { label: string; count: number; rate: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1"><span>{label}</span><span>{count} ({Math.round(rate * 100)}%)</span></div>
      <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, rate * 100)}%` }} />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-2"><span className="text-neutral-500">{label}</span><span className="font-medium text-neutral-900 dark:text-white">{value}</span></div>
}