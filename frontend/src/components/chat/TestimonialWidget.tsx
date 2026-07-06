import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Star, MessageSquareQuote, PlusCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getPublicTestimonials } from '@/services/testimonialService'
import { TestimonialModal } from './TestimonialModal'

interface TestimonialWidgetProps {
  sessionId?: string
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(v => (
        <Star
          key={v}
          className={clsx(
            'w-3 h-3',
            v <= rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-300 dark:text-neutral-600'
          )}
        />
      ))}
    </div>
  )
}

export function TestimonialWidget({ sessionId }: TestimonialWidgetProps) {
  const [open, setOpen] = useState(false)

  const { data: testimonials = [] } = useQuery({
    queryKey: ['public-testimonials'],
    queryFn: () => getPublicTestimonials(3),
    staleTime: 1000 * 60 * 5, // 5 min
  })

  return (
    <>
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Avis des étudiants
            </h3>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Donner mon avis
          </button>
        </div>

        {/* Testimonials list */}
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {testimonials.length === 0 ? (
            <div className="px-4 py-5 text-center">
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-2">
                Aucun avis pour l'instant.
              </p>
              <button
                onClick={() => setOpen(true)}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Soyez le premier à donner votre avis →
              </button>
            </div>
          ) : (
            testimonials.map(t => (
              <div key={t.id} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <StarRow rating={t.rating} />
                  <span className="text-[10px] text-neutral-400 flex-shrink-0">
                    {format(parseISO(t.created_at), 'd MMM yyyy', { locale: fr })}
                  </span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-3">
                  "{t.text}"
                </p>
                {t.author_label && (
                  <p className="text-[10px] text-neutral-400 font-medium">
                    — {t.author_label}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {testimonials.length > 0 && (
          <div className="px-4 py-2.5 border-t border-neutral-100 dark:border-neutral-800 text-center">
            <button
              onClick={() => setOpen(true)}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              + Laisser mon avis
            </button>
          </div>
        )}
      </div>

      <TestimonialModal
        open={open}
        onClose={() => setOpen(false)}
        sessionId={sessionId}
      />
    </>
  )
}
