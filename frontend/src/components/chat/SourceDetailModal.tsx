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
