import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Eye, EyeOff, Trash2, MessageSquareQuote } from 'lucide-react'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  getAllTestimonials,
  toggleTestimonialVisibility,
  deleteTestimonial,
  type TestimonialAdmin,
} from '@/services/testimonialService'
import { Card, StatCard } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(v => (
        <Star
          key={v}
          className={clsx(
            'w-3.5 h-3.5',
            v <= rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-300 dark:text-neutral-600'
          )}
        />
      ))}
    </div>
  )
}

function avgRating(testimonials: TestimonialAdmin[]): string {
  if (!testimonials.length) return '–'
  const avg = testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length
  return avg.toFixed(1)
}

export function TestimonialsPanel() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all')

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: getAllTestimonials,
  })

  const visibilityMutation = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) =>
      toggleTestimonialVisibility(id, visible),
    onSuccess: (_, { visible }) => {
      qc.invalidateQueries({ queryKey: ['admin-testimonials'] })
      qc.invalidateQueries({ queryKey: ['public-testimonials'] })
      toast.success(visible ? 'Témoignage rendu visible' : 'Témoignage masqué')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTestimonial,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-testimonials'] })
      qc.invalidateQueries({ queryKey: ['public-testimonials'] })
      toast.success('Témoignage supprimé')
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  if (isLoading) return <PageSpinner />

  const visible = testimonials.filter(t => t.visible)
  const hidden = testimonials.filter(t => !t.visible)
  const filtered =
    filter === 'visible' ? visible : filter === 'hidden' ? hidden : testimonials

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total avis"
          value={testimonials.length}
          icon={<MessageSquareQuote className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Note moyenne"
          value={`${avgRating(testimonials)} / 5`}
          icon={<Star className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          label="Publiés"
          value={visible.length}
          icon={<Eye className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Masqués"
          value={hidden.length}
          icon={<EyeOff className="w-5 h-5" />}
          color="sky"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'visible', 'hidden'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            )}
          >
            {f === 'all' ? 'Tous' : f === 'visible' ? 'Publiés' : 'Masqués'}
            <span className="ml-1.5 text-xs opacity-70">
              {f === 'all' ? testimonials.length : f === 'visible' ? visible.length : hidden.length}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <Card>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquareQuote className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Aucun témoignage dans cette catégorie.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filtered.map(t => (
              <div key={t.id} className="py-4 flex gap-4">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarRow rating={t.rating} />
                    <Badge variant={t.visible ? 'success' : 'warning'}>
                      {t.visible ? 'Publié' : 'Masqué'}
                    </Badge>
                    {t.author_label && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        {t.author_label}
                      </span>
                    )}
                    <span className="text-xs text-neutral-400 ml-auto">
                      {format(parseISO(t.created_at), 'd MMM yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    "{t.text}"
                  </p>
                  {t.session_id && (
                    <p className="text-[11px] text-neutral-400 font-mono truncate">
                      Session : {t.session_id}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => visibilityMutation.mutate({ id: t.id, visible: !t.visible })}
                    title={t.visible ? 'Masquer' : 'Rendre visible'}
                    className="gap-1"
                  >
                    {t.visible ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => {
                      if (confirm('Supprimer ce témoignage définitivement ?')) {
                        deleteMutation.mutate(t.id)
                      }
                    }}
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
