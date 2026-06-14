import { BookOpen, FileText } from 'lucide-react'
import { clsx } from 'clsx'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import type { Source } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  admission: 'Admission',
  inscription: 'Inscription',
  examens: 'Examens',
  notes: 'Notes',
  boursers: 'Bourses',
  stages: 'Stages',
  diplomes: 'Diplômes',
  emploi_du_temps: 'Emploi du temps',
  reglement: 'Règlement',
  general: 'Général',
}

interface SourceDetailModalProps {
  source: Source | null
  onClose: () => void
}

export function SourceDetailModal({ source, onClose }: SourceDetailModalProps) {
  if (!source) return null

  const title = source.title || source.document || 'Document source'
  const pct   = Math.round(source.relevanceScore * 100)
  const text  = source.content || source.excerpt || ''

  const barColor =
    pct >= 80 ? 'bg-success-500' :
    pct >= 60 ? 'bg-primary-500' :
    'bg-warning-500'

  const category = source.category ? CATEGORY_LABELS[source.category] || source.category : null

  return (
    <Modal open={!!source} onClose={onClose} title="Source citée" size="md">
      <div className="space-y-5">

        {/* Document header */}
        <div className="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/30">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight mb-2">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {category && <Badge variant="primary">{category}</Badge>}
              {source.page && <Badge variant="default">Page {source.page}</Badge>}
            </div>
          </div>
        </div>

        {/* Relevance score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Score de pertinence
            </span>
            <span className={clsx(
              'text-sm font-bold',
              pct >= 80 ? 'text-success-600 dark:text-success-400' :
              pct >= 60 ? 'text-primary-600 dark:text-primary-400' :
              'text-warning-600 dark:text-warning-400'
            )}>
              {pct}%
            </span>
          </div>
          <div className="h-2.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all duration-700', barColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
            {pct >= 80 ? 'Pertinence élevée — extrait très lié à votre question.' :
             pct >= 60 ? 'Pertinence modérée — extrait partiellement lié à votre question.' :
             'Pertinence faible — extrait utilisé comme référence complémentaire.'}
          </p>
        </div>

        {/* Chunk content */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Extrait du document
          </p>
          <div className="bg-neutral-50 dark:bg-neutral-800/80 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 max-h-60 overflow-y-auto">
            {text ? (
              <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                {text}
              </p>
            ) : (
              <p className="text-sm text-neutral-400 dark:text-neutral-500 italic text-center py-4">
                Aucun extrait disponible pour ce document.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
          <BookOpen className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            Source officielle ESPA — École Supérieure Polytechnique d'Antsiranana
          </span>
        </div>

      </div>
    </Modal>
  )
}
