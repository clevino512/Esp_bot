import { useState, useRef, useCallback, useEffect, type ChangeEvent, type KeyboardEvent } from 'react'
import { AudioLines, Paperclip, Send, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { VoiceButton } from './VoiceButton'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import {
  AUDIO_FILE_ACCEPT,
  formatAudioDuration,
  validateAudioFile,
} from '@/services/voiceService'
import { stopVoicePlayback } from '@/services/voicePlayback'

interface AudioDraft {
  blob: Blob
  name: string
  duration: number
  previewUrl: string
}

interface InputBarProps {
  onSendText: (message: string) => void
  onSendVoice: (audio: Blob) => Promise<boolean>
  disabled?: boolean
}

export function InputBar({ onSendText, onSendVoice, disabled }: InputBarProps) {
  const [value, setValue] = useState('')
  const [audioDraft, setAudioDraft] = useState<AudioDraft | null>(null)
  const [sendingAudio, setSendingAudio] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioPreviewRef = useRef<HTMLAudioElement>(null)

  const createAudioDraft = useCallback((blob: Blob, name: string, duration: number) => {
    setAudioDraft({
      blob,
      name,
      duration,
      previewUrl: URL.createObjectURL(blob),
    })
  }, [])

  const onAudioReady = useCallback((audio: Blob, duration: number) => {
    createAudioDraft(audio, 'Enregistrement vocal', duration)
  }, [createAudioDraft])

  const { recordingState, duration, startRecording, stopRecording, cancelRecording } =
    useVoiceRecorder({ onAudioReady })

  const isRecordingActive = recordingState !== 'idle'
  const canSendText = value.trim().length > 0 && !disabled && !isRecordingActive && !audioDraft
  const canSendAudio = Boolean(audioDraft) && !disabled && !isRecordingActive && !sendingAudio

  useEffect(() => {
    const previewUrl = audioDraft?.previewUrl
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [audioDraft?.previewUrl])

  useEffect(() => {
    const pausePreview = () => audioPreviewRef.current?.pause()
    window.addEventListener('unibot:speech-start', pausePreview)
    return () => window.removeEventListener('unibot:speech-start', pausePreview)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!canSendText) return
    onSendText(value.trim())
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [canSendText, value, onSendText])

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const handleInput = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value)
    event.target.style.height = 'auto'
    event.target.style.height = Math.min(event.target.scrollHeight, 120) + 'px'
  }, [])

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validationError = validateAudioFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }
    createAudioDraft(file, file.name, 0)
  }

  async function handleSendAudio() {
    if (!audioDraft || !canSendAudio) return
    setSendingAudio(true)
    try {
      const accepted = await onSendVoice(audioDraft.blob)
      if (accepted) setAudioDraft(null)
    } catch {
      toast.error('Échec de l’envoi audio. Votre aperçu est conservé, vous pouvez réessayer.')
    } finally {
      setSendingAudio(false)
    }
  }

  function handleDiscardAudio() {
    setAudioDraft(null)
    if (recordingState !== 'idle') cancelRecording()
  }

  return (
    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
      {audioDraft && (
        <div className="mb-3 rounded-2xl border border-primary-200 bg-primary-50/70 p-3 dark:border-primary-800/50 dark:bg-primary-900/10">
          <div className="mb-2 flex min-w-0 items-center gap-2">
            <AudioLines className="h-4 w-4 flex-shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-700 dark:text-neutral-200">
              {audioDraft.name}
            </span>
            {audioDraft.duration > 0 && (
              <span className="flex-shrink-0 text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                {formatAudioDuration(audioDraft.duration)}
              </span>
            )}
          </div>
          <audio
            ref={audioPreviewRef}
            controls
            preload="metadata"
            src={audioDraft.previewUrl}
            onPlay={() => stopVoicePlayback()}
            onLoadedMetadata={event => {
              const seconds = event.currentTarget.duration
              if (!Number.isFinite(seconds) || audioDraft.duration > 0) return
              setAudioDraft(current =>
                current?.previewUrl === audioDraft.previewUrl
                  ? { ...current, duration: Math.ceil(seconds) }
                  : current
              )
            }}
            className="mb-3 h-10 w-full"
            aria-label={`Écouter l’aperçu audio ${audioDraft.name}`}
          />
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDiscardAudio}
              disabled={sendingAudio || disabled}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-white hover:text-error-600 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Retirer
            </button>
            <button
              type="button"
              onClick={() => void handleSendAudio()}
              disabled={!canSendAudio}
              className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {sendingAudio ? 'Envoi…' : 'Envoyer le vocal'}
            </button>
          </div>
        </div>
      )}

      <div className={clsx(
        'flex items-end gap-2 bg-white dark:bg-neutral-800',
        'border border-neutral-200 dark:border-neutral-700 rounded-2xl',
        'shadow-card transition-shadow focus-within:shadow-soft focus-within:border-primary-300 dark:focus-within:border-primary-700',
        'px-3 py-2'
      )}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled || isRecordingActive || Boolean(audioDraft)}
          placeholder={
            audioDraft
              ? 'Envoyez ou retirez l’audio pour continuer…'
              : isRecordingActive
              ? 'Enregistrement en cours…'
              : 'Posez votre question… (Entrée pour envoyer)'
          }
          rows={1}
          className={clsx(
            'flex-1 resize-none bg-transparent text-sm text-neutral-900 dark:text-white',
            'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
            'focus:outline-none leading-relaxed py-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'max-h-[120px] overflow-y-auto'
          )}
        />

        <div className="flex flex-shrink-0 items-center gap-1 pb-0.5">
          {!audioDraft && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={AUDIO_FILE_ACCEPT}
                onChange={handleFileSelection}
                disabled={disabled || isRecordingActive}
                className="sr-only"
                aria-label="Choisir un fichier audio"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isRecordingActive}
                aria-label="Importer un fichier audio"
                title="Importer un fichier audio"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-700 dark:hover:text-primary-400"
              >
                <Paperclip className="h-4 w-4" aria-hidden="true" />
              </button>
              <VoiceButton
                recordingState={recordingState}
                duration={duration}
                onStart={() => void startRecording()}
                onStop={stopRecording}
                onCancel={cancelRecording}
                disabled={disabled || isRecordingActive}
              />
            </>
          )}

          {!audioDraft && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSendText}
              className={clsx(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                canSendText
                  ? 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-sm active:scale-95'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
              )}
              title="Envoyer (Entrée)"
              aria-label="Envoyer le message"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-neutral-400 dark:text-neutral-600">
        UniBot peut faire des erreurs. Vérifiez les informations importantes auprès de la scolarité.
      </p>
    </div>
  )
}
