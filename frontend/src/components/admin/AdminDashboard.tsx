import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  Mic,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getDashboardStats } from '@/services/adminService'
import { Card, StatCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { mockLogs } from '@/data/mockData'

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })

  if (isLoading) return <PageSpinner />
  if (!stats) return null

  const recentLogs = mockLogs.slice(0, 5)
  const fallbackLogs = mockLogs.filter(l => l.status === 'fallback').slice(0, 3)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Aujourd'hui"
          value={stats.activeSessionsToday}
          icon={<MessageSquare className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Taux résolution"
          value={`${Math.round(stats.resolvedRate * 100)}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          change={{ value: 3, positive: true }}
          color="green"
        />
        <StatCard
          label="Score MRR@5"
          value={stats.mrr5Score.toFixed(2)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="sky"
        />
        <StatCard
          label="Usage vocal"
          value={`${Math.round(stats.voiceUsageRate * 100)}%`}
          icon={<Mic className="w-5 h-5" />}
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
            {recentLogs.map(log => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  log.status === 'resolved'
                    ? 'bg-success-100 dark:bg-success-900/20'
                    : 'bg-warning-100 dark:bg-warning-900/20'
                }`}>
                  {log.status === 'resolved'
                    ? <CheckCircle className="w-3.5 h-3.5 text-success-600" />
                    : <XCircle className="w-3.5 h-3.5 text-warning-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 truncate">
                    {log.userQuestion}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-neutral-400">
                      {format(parseISO(log.timestamp), "HH:mm", { locale: fr })}
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
            ))}
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
            {fallbackLogs.map(log => (
              <div key={log.id} className="p-3 bg-warning-50 dark:bg-warning-900/10 border border-warning-200 dark:border-warning-800/30 rounded-xl">
                <p className="text-sm text-neutral-800 dark:text-neutral-200 mb-1.5">
                  {log.userQuestion}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Hors domaine</Badge>
                  <span className="text-xs text-neutral-400">
                    {format(parseISO(log.timestamp), 'd MMM', { locale: fr })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-4 text-center">
            Ces questions nécessitent des documents supplémentaires dans la base de connaissances.
          </p>
        </Card>
      </div>
    </div>
  )
}
