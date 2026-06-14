import { useState } from 'react'
import { Star, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  SUS_QUESTIONS,
  SUSResponses,
  calculateSUSScore,
  getSUSGrade,
  submitSUSFeedback,
} from '@/services/susService'

const SUS_SUBMITTED_KEY = 'unibot_sus_submitted'

const SCALE_LABELS = [
  'Pas du tout\nd\'accord',
  'Plutôt\nen désaccord',
  'Neutre',
  'Plutôt\nd\'accord',
  'Tout à fait\nd\'accord',
]

interface SUSModalProps {
  open: boolean
  onClose: () => void
  sessionId: string
}

export function SUSModal({ open, onClose, sessionId }: SUSModalProps) {
  const [responses, setResponses] = useState<SUSResponses>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const answeredCount = Object.keys(responses).length
  const allAnswered = answeredCount === SUS_QUESTIONS.length

  function handleSelect(questionId: number, value: number) {
    setResponses(prev => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit() {
    if (!allAnswered) {
      toast.error('Veuillez répondre à toutes les questions.')
      return
    }
    const computedScore = calculateSUSScore(responses)
    setScore(computedScore)
    setIsSubmitting(true)
    try {
      await submitSUSFeedback({ sessionId, responses, score: computedScore })
    } catch {
    }
    localStorage.setItem(SUS_SUBMITTED_KEY, 'true')
    setSubmitted(true)
    setIsSubmitting(false)
  }

  function handleClose() {
    setResponses({})
    setSubmitted(false)
    setScore(0)
    onClose()
  }

  const grade = submitted ? getSUSGrade(score) : null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={submitted ? 'Merci pour votre évaluation !' : 'Évaluer UniBot ESPA'}
      size="lg"
    >
      {submitted && grade ? (
        <div className="text-center py-4 animate-fade-in">
          <CheckCircle className="w-14 h-14 text-success-500 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Votre retour nous aide à améliorer UniBot. Voici votre évaluation :
          </p>
          <div className="inline-flex items-center gap-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl px-8 py-5 mb-4">
            <div>
              <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Score SUS</p>
              <p className={clsx('text-5xl font-bold', grade.color)}>{Math.round(score)}</p>
              <p className="text-xs text-neutral-400 mt-1">/ 100</p>
            </div>
            <div className="w-px h-16 bg-neutral-200 dark:bg-neutral-700" />
            <div className="text-left">
              <p className={clsx('text-2xl font-bold', grade.color)}>
                {grade.grade} — {grade.label}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-[220px]">
                {grade.description}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <ScoreBenchmarkBar score={score} />
          </div>
          <Button onClick={handleClose} className="mt-6">
            Fermer
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Questionnaire SUS — évaluez votre expérience avec UniBot ESPA.
            <span className="ml-1 font-medium text-neutral-700 dark:text-neutral-300">
              ({answeredCount}/{SUS_QUESTIONS.length} répondues)
            </span>
          </p>

          {/* Scale header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto] gap-2 pb-1">
            <div />
            <div className="grid grid-cols-5 gap-1 w-[240px]">
              {SCALE_LABELS.map((label, i) => (
                <p key={i} className="text-[10px] text-neutral-400 text-center leading-tight whitespace-pre-line">
                  {label}
                </p>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
            {SUS_QUESTIONS.map((q, index) => {
              const selected = responses[q.id]
              return (
                <div
                  key={q.id}
                  className={clsx(
                    'rounded-xl border p-3 transition-colors',
                    selected
                      ? 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="flex-1 text-sm text-neutral-800 dark:text-neutral-200">
                      <span className="font-semibold text-neutral-400 mr-2">{index + 1}.</span>
                      {q.text}
                    </p>
                    {/* Likert scale */}
                    <div className="flex items-center gap-1 sm:w-[240px] justify-center sm:justify-end flex-shrink-0">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          onClick={() => handleSelect(q.id, val)}
                          title={SCALE_LABELS[val - 1].replace('\n', ' ')}
                          className={clsx(
                            'w-10 h-10 rounded-lg text-sm font-semibold transition-all',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                            selected === val
                              ? 'bg-primary-600 text-white shadow-sm scale-105'
                              : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700'
                          )}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-xs text-neutral-400">
              Basé sur le questionnaire SUS (System Usability Scale)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Plus tard
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered}
                loading={isSubmitting}
                icon={<Star className="w-4 h-4" />}
              >
                Soumettre
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

function ScoreBenchmarkBar({ score }: { score: number }) {
  const ranges = [
    { label: 'F', min: 0, max: 51, color: 'bg-error-400' },
    { label: 'D', min: 51, max: 68, color: 'bg-warning-400' },
    { label: 'C', min: 68, max: 80, color: 'bg-sky-400' },
    { label: 'B', min: 80, max: 90, color: 'bg-primary-400' },
    { label: 'A', min: 90, max: 100, color: 'bg-success-400' },
  ]

  const clampedScore = Math.max(0, Math.min(100, score))

  return (
    <div className="px-2">
      <div className="relative h-6 rounded-full overflow-hidden flex">
        {ranges.map(r => (
          <div
            key={r.label}
            className={clsx('h-full', r.color, 'opacity-30')}
            style={{ width: `${r.max - r.min}%` }}
          />
        ))}
        {/* Marker */}
        <div
          className="absolute top-0 bottom-0 flex items-center -translate-x-1/2"
          style={{ left: `${clampedScore}%` }}
        >
          <div className="w-3 h-3 rounded-full bg-neutral-800 dark:bg-white border-2 border-white dark:border-neutral-800 shadow-md" />
        </div>
      </div>
      <div className="flex justify-between mt-1">
        {ranges.map(r => (
          <span key={r.label} className="text-[10px] text-neutral-400 font-medium">
            {r.label}
          </span>
        ))}
      </div>
      <div className="flex justify-between">
        <span className="text-[10px] text-neutral-400">0</span>
        <span className="text-[10px] text-neutral-400">100</span>
      </div>
    </div>
  )
}
