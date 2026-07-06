import { useState } from 'react'
import { Star, CheckCircle, User } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { submitTestimonial } from '@/services/testimonialService'

interface TestimonialModalProps {
  open: boolean
  onClose: () => void
  sessionId?: string
}

const STAR_LABELS = ['Décevant', 'Passable', 'Bien', 'Très bien', 'Excellent']

export function TestimonialModal({ open, onClose, sessionId }: TestimonialModalProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [text, setText] = useState('')
  const [authorLabel, setAuthorLabel] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const canSubmit = rating > 0 && text.trim().length >= 10

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    try {
      await submitTestimonial({
        text: text.trim(),
        rating,
        session_id: sessionId,
        author_label: authorLabel.trim() || undefined,
      })
      setSubmitted(true)
    } catch {
      toast.error('Impossible d\'envoyer votre avis. Réessayez plus tard.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setRating(0)
    setHovered(0)
    setText('')
    setAuthorLabel('')
    setSubmitted(false)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={submitted ? 'Merci pour votre témoignage !' : 'Laisser un avis sur UniBot'}
      size="md"
    >
      {submitted ? (
        <div className="text-center py-6 animate-fade-in">
          <CheckCircle className="w-14 h-14 text-success-500 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">
            Votre avis a bien été enregistré et sera affiché publiquement pour aider d'autres étudiants.
          </p>
          <Button onClick={handleClose} className="mt-6">
            Fermer
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Star rating */}
          <div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Note globale <span className="text-error-500">*</span>
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  onClick={() => setRating(val)}
                  onMouseEnter={() => setHovered(val)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-1 transition-transform hover:scale-110 focus-visible:outline-none"
                  aria-label={`${val} étoile${val > 1 ? 's' : ''}`}
                >
                  <Star
                    className={clsx(
                      'w-8 h-8 transition-colors',
                      (hovered || rating) >= val
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-neutral-300 dark:text-neutral-600'
                    )}
                  />
                </button>
              ))}
              {(hovered || rating) > 0 && (
                <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
                  {STAR_LABELS[(hovered || rating) - 1]}
                </span>
              )}
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
              Votre avis <span className="text-error-500">*</span>
              <span className="font-normal text-neutral-400 ml-1">(10 – 500 caractères)</span>
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Partagez votre expérience avec UniBot : ce qui vous a aidé, ce qui pourrait être amélioré…"
              className={clsx(
                'w-full rounded-xl border px-3.5 py-2.5 text-sm resize-none',
                'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white',
                'border-neutral-200 dark:border-neutral-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                'placeholder:text-neutral-400 dark:placeholder:text-neutral-500'
              )}
            />
            <p className="text-right text-xs text-neutral-400 mt-1">
              {text.length}/500
            </p>
          </div>

          {/* Optional author label */}
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Qui êtes-vous ?
                <span className="font-normal text-neutral-400">(optionnel)</span>
              </span>
            </label>
            <input
              type="text"
              value={authorLabel}
              onChange={e => setAuthorLabel(e.target.value)}
              maxLength={50}
              placeholder="Ex : Étudiant L2 Informatique, Personnel ESPA…"
              className={clsx(
                'w-full rounded-xl border px-3.5 py-2.5 text-sm',
                'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white',
                'border-neutral-200 dark:border-neutral-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                'placeholder:text-neutral-400 dark:placeholder:text-neutral-500'
              )}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-xs text-neutral-400">Votre avis sera visible publiquement.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                loading={loading}
                icon={<Star className="w-4 h-4" />}
              >
                Publier
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
