import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  MessageSquare,
  Mic,
  ChevronDown,
  ChevronUp,
  Search,
  ThumbsUp,
  ThumbsDown,
  FileDown,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { clsx } from 'clsx'
import { getLogs } from '@/services/adminService'
import type { ConversationLog } from '@/types'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { exportLogsCSV } from '@/utils/exportUtils'

const STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  resolved: { label: 'Resolu', variant: 'success' },
  unanswered: { label: 'Sans reponse', variant: 'warning' },
  fallback: { label: 'Hors domaine', variant: 'warning' },
  escalated: { label: 'Escalade', variant: 'error' },
  answered: { label: 'Repondu', variant: 'success' },
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.75 ? 'bg-success-500' : value >= 0.5 ? 'bg-warning-500' : 'bg-error-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-neutral-100 dark:bg-neutral-700 rounded-full h-1.5">
        <div className={clsx('h-1.5 rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">{pct}%</span>
    </div>
  )
}

function LogRow({ log }: { log: ConversationLog }) {
  const [expanded, setExpanded] = useState(false)
  const statusConf = STATUS_CONFIG[log.status] || STATUS_CONFIG.answered
  const responseTime = log.responseTime || 0
  const query = log.query || log.userQuestion || ''
  const response = log.response || log.botResponse || ''

  return (
    <div className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        <div className="flex-shrink-0 mt-0.5">
          {log.mode === 'voice'
            ? <Mic className="w-4 h-4 text-primary-500" />
            : <MessageSquare className="w-4 h-4 text-neutral-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate pr-4">
              {query}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
              {log.feedback === 'positive' && <ThumbsUp className="w-3.5 h-3.5 text-success-500" />}
              {log.feedback === 'helpful' && <ThumbsUp className="w-3.5 h-3.5 text-success-500" />}
              {log.feedback === 'negative' && <ThumbsDown className="w-3.5 h-3.5 text-error-500" />}
              {log.feedback === 'not_helpful' && <ThumbsDown className="w-3.5 h-3.5 text-error-500" />}
              {expanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {format(parseISO(log.timestamp), "d MMM 'a' HH:mm", { locale: fr })}
            </span>
            <ConfidenceBar value={log.confidence} />
            <span className="text-xs text-neutral-400">
              {responseTime < 1000 ? `${responseTime}ms` : `${(responseTime / 1000).toFixed(1)}s`}
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 animate-slide-down">
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Reponse du bot</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-4">
                {response}
              </p>
            </div>
            {log.sources.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
                  Sources ({log.sources.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {log.sources.map((s, idx) => {
                    const sourceStr = typeof s === 'string' ? s : (s as { title?: string; document?: string }).title || (s as { title?: string; document?: string }).document || 'Source'
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg text-xs"
                      >
                        {sourceStr}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs text-neutral-400">Session: <code className="font-mono">{log.sessionId.slice(0, 12)}...</code></span>
              <span className="text-xs text-neutral-400">Mode: {log.mode === 'voice' ? 'Vocal' : 'Texte'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function LogsViewer() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const LIMIT = 10

  const { data, isLoading } = useQuery({
    queryKey: ['logs', page, statusFilter],
    queryFn: () => getLogs({ page, pageSize: LIMIT }),
  })

  const logs = data?.logs ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / LIMIT)

  const filtered = search
    ? logs.filter(l => {
        const query = l.query || l.userQuestion || ''
        const response = l.response || l.botResponse || ''
        return query.toLowerCase().includes(search.toLowerCase()) ||
               response.toLowerCase().includes(search.toLowerCase())
      })
    : logs

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Filters + CSV export */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Input
          placeholder="Rechercher dans les conversations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="sm:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-10 pl-3 pr-8 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="resolved">Resolus</option>
          <option value="fallback">Hors domaine</option>
          <option value="unresolved">Non resolus</option>
        </select>
        <div className="sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            disabled={filtered.length === 0}
            onClick={() => exportLogsCSV(filtered)}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <FileDown className="w-4 h-4" />
            Exporter CSV ({filtered.length})
          </Button>
        </div>
      </div>

      {/* Log list */}
      <Card padding="none" className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Aucune conversation trouvee</p>
          </div>
        ) : (
          filtered.map(log => <LogRow key={log.id} log={log} />)
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {total} conversation{total !== 1 ? 's' : ''} au total
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Precedent
            </Button>
            <span className="text-sm text-neutral-600 dark:text-neutral-400 px-2">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
