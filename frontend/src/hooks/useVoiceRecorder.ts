import { useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import type { RecordingState } from '@/types'
import { transcribeAudio } from '@/services/voiceService'

interface UseVoiceRecorderOptions {
  onTranscript: (text: string) => void
  maxDurationSeconds?: number
}

export function useVoiceRecorder({ onTranscript, maxDurationSeconds = 60 }: UseVoiceRecorderOptions) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const startRecording = useCallback(async () => {
    if (recordingState !== 'idle') return

    setRecordingState('requesting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setRecordingState('recording')
      setDuration(0)
      startTimeRef.current = Date.now()
      chunksRef.current = []

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setDuration(elapsed)
        if (elapsed >= maxDurationSeconds) {
          stopRecording()
        }
      }, 500)

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (timerRef.current) clearInterval(timerRef.current)

        const blob = new Blob(chunksRef.current, { type: mimeType })
        setRecordingState('processing')

        try {
          const result = await transcribeAudio(blob)
          if (result.transcript) {
            onTranscript(result.transcript)
          } else {
            toast.error('Transcription vide. Veuillez réessayer.')
          }
        } catch {
          toast.error('Erreur lors de la transcription.')
          setRecordingState('error')
          return
        }

        setRecordingState('idle')
        setDuration(0)
      }

      recorder.start(200)
    } catch (err) {
      const error = err as Error
      if (error.name === 'NotAllowedError') {
        toast.error('Accès au microphone refusé. Veuillez autoriser l\'accès.')
      } else {
        toast.error('Impossible d\'accéder au microphone.')
      }
      setRecordingState('idle')
    }
  }, [recordingState, maxDurationSeconds, onTranscript])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }, [])

  const cancelRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
        mediaRecorderRef.current.stop()
      }
    }
    setRecordingState('idle')
    setDuration(0)
    chunksRef.current = []
  }, [])

  return {
    recordingState,
    duration,
    isRecording: recordingState === 'recording',
    isProcessing: recordingState === 'processing',
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
