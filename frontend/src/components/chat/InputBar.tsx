import { useState, useRef, useCallback, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { clsx } from 'clsx'
import { VoiceButton } from './VoiceButton'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'

interface InputBarProps {
  onSendText: (message: string) => void
  onSendVoice: (transcript: string) => void
  disabled?: boolean
}

export function InputBar({ onSendText, onSendVoice, disabled }: InputBarProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { recordingState, duration, startRecording, stopRecording, cancelRecording } =
    useVoiceRecorder({ onTranscript: onSendVoice })

  const isRecordingActive = recordingState !== 'idle'
  const canSend = value.trim().length > 0 && !disabled && !isRecordingActive

  const handleSubmit = useCallback(() => {
    if (!canSend) return
    onSendText(value.trim())
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [canSend, value, onSendText])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [])

  return (
    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
      <div className={clsx(
        'flex items-end gap-2 bg-white dark:bg-neutral-800',
        'border border-neutral-200 dark:border-neutral-700 rounded-2xl',
        'shadow-card transition-shadow focus-within:shadow-soft focus-within:border-primary-300 dark:focus-within:border-primary-700',
        'px-3 py-2'
      )}>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled || isRecordingActive}
          placeholder={isRecordingActive ? '' : 'Posez votre question… (Entrée pour envoyer)'}
          rows={1}
          className={clsx(
            'flex-1 resize-none bg-transparent text-sm text-neutral-900 dark:text-white',
            'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
            'focus:outline-none leading-relaxed py-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'max-h-[120px] overflow-y-auto'
          )}
        />

        {/* Actions */}
        <div className="flex items-center gap-1 pb-0.5">
          <VoiceButton
            recordingState={recordingState}
            duration={duration}
            onStart={startRecording}
            onStop={stopRecording}
            onCancel={cancelRecording}
            disabled={disabled}
          />

          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className={clsx(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              canSend
                ? 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-sm active:scale-95'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
            )}
            title="Envoyer (Entrée)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-neutral-400 dark:text-neutral-600">
        UniBot peut faire des erreurs. Vérifiez les informations importantes auprès de la scolarité.
      </p>
    </div>
  )
}
