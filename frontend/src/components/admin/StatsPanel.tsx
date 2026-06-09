import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { MessageSquare, CircleCheck as CheckCircle, Clock, Mic, FileText, Hash, Target, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getDashboardStats } from '@/services/adminService'
import { StatCard, Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'

const CATEGORY_LABELS: Record<string, string> = {
  procedures: 'Procédures',
  reglements: 'Règlements',
  calendriers: 'Calendriers',
  faq: 'FAQ',
  guides: 'Guides',
  autres: 'Autres',
}

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#0ea5e9', '#8b5cf6', '#64748b']

export function StatsPanel() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })

  if (isLoading) return <PageSpinner />
  if (!stats) return null

  const chartData = stats.dailyStats.map(d => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'dd MMM', { locale: fr }),
    resolvedRate: Math.round((d.resolvedCount / d.conversations) * 100),
  }))

  const pieData = stats.categoryStats.map(c => ({
    name: CATEGORY_LABELS[c.category] ?? c.category,
    value: c.queryCount,
    percentage: c.percentage,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Conversations totales"
          value={stats.totalConversations.toLocaleString('fr')}
          icon={<MessageSquare className="w-5 h-5" />}
          change={{ value: 12, positive: true }}
          color="blue"
        />
        <StatCard
          label="Taux de résolution"
          value={`${Math.round(stats.resolvedRate * 100)}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          change={{ value: 3, positive: true }}
          color="green"
        />
        <StatCard
          label="Temps de réponse moy."
          value={`${(stats.avgResponseTime / 1000).toFixed(1)}s`}
          icon={<Clock className="w-5 h-5" />}
          change={{ value: 5, positive: false }}
          color="amber"
        />
        <StatCard
          label="Utilisation vocale"
          value={`${Math.round(stats.voiceUsageRate * 100)}%`}
          icon={<Mic className="w-5 h-5" />}
          change={{ value: 8, positive: true }}
          color="sky"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Documents indexés"
          value={stats.totalDocuments}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Chunks vectorisés"
          value={stats.totalChunks}
          icon={<Hash className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Score MRR@5"
          value={stats.mrr5Score.toFixed(2)}
          icon={<Target className="w-5 h-5" />}
          color="sky"
        />
        <StatCard
          label="Sessions actives"
          value={stats.activeSessionsToday}
          icon={<Users className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area chart — conversations */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
            Conversations (7 derniers jours)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-700" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, white)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="conversations" name="Total" stroke="#3b82f6" fill="url(#colorConv)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="resolvedCount" name="Résolues" stroke="#22c55e" fill="url(#colorResolved)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie chart — categories */}
        <Card>
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
            Requêtes par catégorie
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{value}</span>
                )}
              />
              <Tooltip
                formatter={(value, name) => [`${value} requêtes`, name]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top questions */}
      <Card>
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
          Questions les plus fréquentes
        </h3>
        <div className="space-y-3">
          {stats.topQuestions.map((q, i) => (
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
                    style={{ width: `${(q.count / stats.topQuestions[0].count) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
