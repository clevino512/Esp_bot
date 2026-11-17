import { Mic, MicOff, Loader as Loader2, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { RecordingState } from '@/types'
import { formatAudioDuration } from '@/services/voiceService'

interface VoiceButtonProps {
  recordingState: RecordingState
  duration: number
  onStart: () => void
  onStop: () => void
  onCancel: () => void
  disabled?: boolean
}

export function VoiceButton({
  recordingState,
  duration,
  onStart,
  onStop,
  onCancel,
  disabled,
}: VoiceButtonProps) {
  const isIdle = recordingState === 'idle'
  const isRecording = recordingState === 'recording'
  const isRequesting = recordingState === 'requesting'

  if (isRequesting) {
    return (
      <div role="status" className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
        <Loader2 className="w-4 h-4 text-primary-600 animate-spin" aria-hidden="true" />
        <span className="text-xs text-primary-600 dark:text-primary-400">Accès au microphone…</span>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-neutral-500 hover:text-error-500"
        >
          Annuler
        </button>
      </div>
    )
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        {/* Cancel */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Annuler l’enregistrement"
          title="Annuler l’enregistrement"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Recording indicator */}
        <div role="timer" aria-label={`Durée ${formatAudioDuration(duration)}`} className="flex items-center gap-2 px-3 py-1.5 bg-error-50 dark:bg-error-900/20 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-error-500 animate-recording" />
          <span className="text-xs font-mono text-error-600 dark:text-error-400 tabular-nums">
            {formatAudioDuration(duration)}
          </span>
        </div>

        {/* Stop */}
        <button
          type="button"
          onClick={onStop}
          aria-label="Terminer l’enregistrement"
          title="Terminer l’enregistrement"
          className="w-9 h-9 rounded-xl bg-error-500 hover:bg-error-600 flex items-center justify-center text-white transition-colors shadow-sm"
        >
          <MicOff className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onStart}
      disabled={disabled}
      aria-label="Enregistrer un message vocal"
      className={clsx(
        'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
        'hover:bg-primary-50 dark:hover:bg-primary-900/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400',
        isIdle && !disabled && 'active:scale-95'
      )}
      title="Enregistrer un message vocal"
    >
      <Mic className="w-5 h-5" aria-hidden="true" />
    </button>
  )
}
