import { useQuery } from '@tanstack/react-query'
import { MessageSquare, CircleCheck as CheckCircle, Clock, FileText, Hash, Target, Users, TriangleAlert as AlertTriangle } from 'lucide-react'
import { getDashboardStats, getTopQuestions } from '@/services/adminService'
import { StatCard, Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'

export function StatsPanel() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(7),
  })

  const { data: topQuestions } = useQuery({
    queryKey: ['top-questions'],
    queryFn: () => getTopQuestions(7, 5),
  })

  if (isLoading) return <PageSpinner />
  if (!stats) return null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Conversations totales"
          value={stats.totalConversations.toLocaleString('fr')}
          icon={<MessageSquare className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Taux de satisfaction"
          value={stats.helpfulRate !== undefined ? `${Math.round(stats.helpfulRate * 100)}%` : 'N/A'}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Temps de reponse moy."
          value={stats.avgResponseTime ? `${(stats.avgResponseTime / 1000).toFixed(1)}s` : 'N/A'}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          label="Taux de fallback"
          value={stats.fallbackRate !== undefined ? `${Math.round(stats.fallbackRate * 100)}%` : 'N/A'}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="sky"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Documents actifs"
          value={stats.activeDocuments ?? stats.totalDocuments}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Chunks vectorises"
          value={stats.totalChunks}
          icon={<Hash className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Confiance moyenne"
          value={stats.avgConfidence !== undefined ? `${Math.round(stats.avgConfidence * 100)}%` : 'N/A'}
          icon={<Target className="w-5 h-5" />}
          color="sky"
        />
        <StatCard
          label="Utilisateurs uniques"
          value={stats.uniqueUsers ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Top questions */}
      <Card>
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
          Questions les plus frequentes
        </h3>
        <div className="space-y-3">
          {(topQuestions ?? []).map((q, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 truncate">{q.question}</p>
                  <Badge variant="default">{q.count}</Badge>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5">
                  <div
                    className="bg-primary-500 rounded-full h-1.5 transition-all duration-500"
                    style={{ width: `${(q.count / (topQuestions?.[0]?.count || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {(!topQuestions || topQuestions.length === 0) && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
              Aucune donnee disponible
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
