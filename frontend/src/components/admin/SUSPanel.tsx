import { useQuery } from '@tanstack/react-query'
import { Star, Users, TrendingUp, Award } from 'lucide-react'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getSUSStats, getSUSGrade } from '@/services/susService'
import { Card, StatCard } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'

const DISTRIBUTION_RANGES = [
  { label: 'F — Inacceptable', range: '0–50', min: 0, max: 51, barColor: 'bg-error-400' },
  { label: 'D — Médiocre', range: '51–67', min: 51, max: 68, barColor: 'bg-warning-400' },
  { label: 'C — Acceptable', range: '68–79', min: 68, max: 80, barColor: 'bg-sky-400' },
  { label: 'B — Bon', range: '80–89', min: 80, max: 90, barColor: 'bg-primary-400' },
  { label: 'A — Excellent', range: '90–100', min: 90, max: 101, barColor: 'bg-success-400' },
]

export function SUSPanel() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['sus-stats'],
    queryFn: getSUSStats,
    retry: 1,
  })

  if (isLoading) return <PageSpinner />

  if (error || !stats || stats.count === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <EmptyState />
        <SUSExplainer />
      </div>
    )
  }

  const grade = getSUSGrade(stats.avgScore)

  const distributionWithCounts = DISTRIBUTION_RANGES.map(r => {
    const count =
      stats.distribution?.find(d => d.min === r.min)?.count ??
      (stats.recentScores?.filter(s => s.score >= r.min && s.score < r.max).length ?? 0)
    return { ...r, count }
  })

  const maxCount = Math.max(...distributionWithCounts.map(d => d.count), 1)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Score SUS moyen"
          value={`${Math.round(stats.avgScore)}/100`}
          icon={<Star className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          label="Évaluations"
          value={stats.count}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Score max"
          value={`${Math.round(stats.maxScore)}/100`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Score min"
          value={`${Math.round(stats.minScore)}/100`}
          icon={<Award className="w-5 h-5" />}
          color="sky"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Score moyen visuel */}
        <Card>
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-5">Score global</h3>
          <div className="flex flex-col items-center">
            {/* Gauge */}
            <div className="relative w-40 h-20 mb-4">
              <svg viewBox="0 0 200 100" className="w-full">
                {/* Background arc */}
                <path
                  d="M 10 100 A 90 90 0 0 1 190 100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="16"
                  className="text-neutral-100 dark:text-neutral-800"
                  strokeLinecap="round"
                />
                {/* Score arc */}
                <path
                  d="M 10 100 A 90 90 0 0 1 190 100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${(stats.avgScore / 100) * 283} 283`}
                  className={clsx(
                    grade.grade === 'A' && 'text-success-500',
                    grade.grade === 'B' && 'text-primary-500',
                    grade.grade === 'C' && 'text-sky-500',
                    grade.grade === 'D' && 'text-warning-500',
                    grade.grade === 'F' && 'text-error-500'
                  )}
                />
              </svg>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <p className={clsx('text-3xl font-bold', grade.color)}>
                  {Math.round(stats.avgScore)}
                </p>
              </div>
            </div>

            <div className="text-center">
              <span className={clsx('text-xl font-bold', grade.color)}>
                {grade.grade} — {grade.label}
              </span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-[200px] text-center">
                {grade.description}
              </p>
            </div>

            {/* Benchmark */}
            <div className="w-full mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-xs text-neutral-400 mb-2 text-center uppercase tracking-wider">
                Référence SUS
              </p>
              <div className="relative h-3 rounded-full overflow-hidden flex">
                {[
                  { color: 'bg-error-300', w: 51 },
                  { color: 'bg-warning-300', w: 17 },
                  { color: 'bg-sky-300', w: 12 },
                  { color: 'bg-primary-300', w: 10 },
                  { color: 'bg-success-300', w: 10 },
                ].map((r, i) => (
                  <div key={i} className={clsx('h-full', r.color)} style={{ width: `${r.w}%` }} />
                ))}
                <div
                  className="absolute top-0 bottom-0 flex items-center -translate-x-1/2"
                  style={{ left: `${Math.max(1, Math.min(99, stats.avgScore))}%` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-800 dark:bg-white border-2 border-white dark:border-neutral-700 shadow" />
                </div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-neutral-400">F 0</span>
                <span className="text-[10px] text-neutral-400">D 51</span>
                <span className="text-[10px] text-neutral-400">C 68</span>
                <span className="text-[10px] text-neutral-400">B 80</span>
                <span className="text-[10px] text-neutral-400">A 90</span>
                <span className="text-[10px] text-neutral-400">100</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Distribution */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-5">Distribution des scores</h3>
          <div className="space-y-4">
            {distributionWithCounts.map(d => (
              <div key={d.label} className="flex items-center gap-3">
                <div className="w-28 flex-shrink-0">
                  <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{d.label}</p>
                  <p className="text-xs text-neutral-400">{d.range}</p>
                </div>
                <div className="flex-1 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full transition-all duration-700', d.barColor)}
                    style={{ width: `${(d.count / maxCount) * 100}%`, minWidth: d.count > 0 ? '4px' : '0' }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {d.count}
                </span>
              </div>
            ))}
          </div>

          {stats.recentScores && stats.recentScores.length > 0 && (
            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">Évaluations récentes</p>
              <div className="space-y-2">
                {stats.recentScores.slice(0, 5).map((s, i) => {
                  const g = getSUSGrade(s.score)
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={clsx('text-xs font-bold w-4', g.color)}>{g.grade}</span>
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          {Math.round(s.score)} pts
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400">
                        {format(parseISO(s.timestamp), 'dd MMM HH:mm', { locale: fr })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      <SUSExplainer />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
        <Star className="w-8 h-8 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        Aucune évaluation SUS pour l'instant
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
        Les évaluations apparaîtront ici dès que des utilisateurs auront rempli le questionnaire dans l'interface de chat.
      </p>
    </div>
  )
}

function SUSExplainer() {
  return (
    <Card>
      <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
        <Award className="w-4 h-4 text-primary-500" />
        À propos du SUS (System Usability Scale)
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { grade: 'A', label: 'Excellent', range: '≥ 90', color: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/30', text: 'text-success-700 dark:text-success-400' },
          { grade: 'B', label: 'Bon', range: '80 – 89', color: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/30', text: 'text-primary-700 dark:text-primary-400' },
          { grade: 'C', label: 'Acceptable', range: '68 – 79', color: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800/30', text: 'text-sky-700 dark:text-sky-400' },
          { grade: 'D', label: 'Médiocre', range: '51 – 67', color: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/30', text: 'text-warning-700 dark:text-warning-400' },
          { grade: 'F', label: 'Inacceptable', range: '< 51', color: 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800/30', text: 'text-error-700 dark:text-error-400' },
        ].map(g => (
          <div key={g.grade} className={clsx('rounded-xl border p-3 text-center', g.color)}>
            <p className={clsx('text-2xl font-bold mb-0.5', g.text)}>{g.grade}</p>
            <p className={clsx('text-xs font-semibold', g.text)}>{g.label}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{g.range}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3">
        Le SUS est un questionnaire standardisé de 10 questions, chacune notée de 1 à 5.
        Le score final est compris entre 0 et 100. Score de référence mondial : <strong>68</strong>.
      </p>
    </Card>
  )
}
