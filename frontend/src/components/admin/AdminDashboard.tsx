import { useQuery } from '@tanstack/react-query'
import {
  CircleCheck as CheckCircle,
  Circle as XCircle,
  MessageSquare,
  Mic,
  TrendingUp,
  TriangleAlert as AlertTriangle,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getDashboardStats, getFallbackQuestions, getLogs } from '@/services/adminService'
import { Card, StatCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { ReportExportButton } from '@/components/admin/ReportExportButton'

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(7),
  })

  const { data: fallbackQuestions } = useQuery({
    queryKey: ['fallback-questions'],
    queryFn: () => getFallbackQuestions(30, 3),
  })

  const { data: logsData } = useQuery({
    queryKey: ['recent-logs'],
    queryFn: () => getLogs({ page: 1, pageSize: 5 }),
  })

  if (statsLoading) return <PageSpinner />
  if (!stats) return null

  const recentLogs = logsData?.logs ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Vue d'ensemble — 7 derniers jours
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Métriques en temps réel de l'assistant UniBot
          </p>
        </div>
        <ReportExportButton />
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Conversations"
          value={stats.totalConversations}
          icon={<MessageSquare className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Taux résolu"
          value={
            stats.helpfulRate !== undefined
              ? `${Math.round(stats.helpfulRate * 100)}%`
              : 'N/A'
          }
          icon={<CheckCircle className="w-5 h-5" />}
          change={{ value: 3, positive: true }}
          color="green"
        />
        <StatCard
          label="Confiance moy."
          value={
            stats.avgConfidence !== undefined
              ? `${Math.round(stats.avgConfidence * 100)}%`
              : 'N/A'
          }
          icon={<TrendingUp className="w-5 h-5" />}
          color="sky"
        />
        <StatCard
          label="Taux fallback"
          value={
            stats.fallbackRate !== undefined
              ? `${Math.round(stats.fallbackRate * 100)}%`
              : 'N/A'
          }
          icon={<AlertTriangle className="w-5 h-5" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent conversations */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
            Conversations récentes
          </h3>
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-6">
                Aucune conversation pour l'instant.
              </p>
            ) : (
              recentLogs.map(log => {
                const query = log.query || log.userQuestion || ''
                const isFallback = log.isFallback || log.status === 'fallback'

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        !isFallback
                          ? 'bg-success-100 dark:bg-success-900/20'
                          : 'bg-warning-100 dark:bg-warning-900/20'
                      }`}
                    >
                      {!isFallback ? (
                        <CheckCircle className="w-3.5 h-3.5 text-success-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-warning-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 truncate">
                        {query}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-neutral-400">
                          {format(parseISO(log.timestamp), 'HH:mm', { locale: fr })}
                        </span>
                        {log.mode === 'voice' && (
                          <span className="flex items-center gap-0.5 text-xs text-primary-500">
                            <Mic className="w-3 h-3" />
                            Vocal
                          </span>
                        )}
                        <span className="text-xs text-neutral-400">
                          {Math.round(log.confidence * 100)}% confiance
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Fallback questions */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-warning-500" />
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              Questions sans réponse
            </h3>
          </div>
          <div className="space-y-3">
            {!fallbackQuestions || fallbackQuestions.length === 0 ? (
              <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-4">
                Aucune question hors domaine détectée.
              </p>
            ) : (
              fallbackQuestions.map((q, i) => (
                <div
                  key={i}
                  className="p-3 bg-warning-50 dark:bg-warning-900/10 border border-warning-200 dark:border-warning-800/30 rounded-xl"
                >
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 mb-1.5">
                    {q.question}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">{q.count}x</Badge>
                    <span className="text-xs text-neutral-400">Hors domaine</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-4 text-center">
            Ces questions nécessitent des documents supplémentaires.
          </p>
        </Card>
      </div>
    </div>
  )
}
