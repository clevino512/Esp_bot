import { useState, useRef, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { RecordingState } from '@/types'
import { MAX_AUDIO_BYTES } from '@/services/voiceService'

interface UseVoiceRecorderOptions {
  onAudioReady: (audio: Blob, durationSeconds: number) => void
  maxDurationSeconds?: number
}

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
]

export function useVoiceRecorder({
  onAudioReady,
  maxDurationSeconds = 60,
}: UseVoiceRecorderOptions) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const cancelledRef = useRef(false)
  const requestIdRef = useRef(0)
  const mountedRef = useRef(true)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }, [])

  const startRecording = useCallback(async () => {
    if (recordingState !== 'idle') return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Ce navigateur ne prend pas en charge l’enregistrement audio.')
      return
    }
    if (!window.isSecureContext) {
      toast.error('Le microphone nécessite une connexion sécurisée (HTTPS).')
      return
    }

    setRecordingState('requesting')
    cancelledRef.current = false
    const requestId = ++requestIdRef.current

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mountedRef.current || cancelledRef.current || requestId !== requestIdRef.current) {
        stream.getTracks().forEach(track => track.stop())
        return
      }
      streamRef.current = stream

      const supportedMime = MIME_CANDIDATES.find(type => MediaRecorder.isTypeSupported(type))
      if (!supportedMime) {
        throw new Error('Ce navigateur ne fournit aucun format audio compatible.')
      }
      const recorder = new MediaRecorder(stream, {
        mimeType: supportedMime,
        audioBitsPerSecond: 64_000,
      })

      mediaRecorderRef.current = recorder
      chunksRef.current = []
      startTimeRef.current = Date.now()
      setDuration(0)
      setRecordingState('recording')

      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onerror = () => {
        toast.error('L’enregistrement audio a été interrompu. Réessayez.')
      }

      recorder.onstop = () => {
        clearTimer()
        releaseStream()
        mediaRecorderRef.current = null

        if (cancelledRef.current) {
          chunksRef.current = []
          if (mountedRef.current) setRecordingState('idle')
          return
        }

        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        const elapsedSeconds = Math.min(
          maxDurationSeconds,
          Math.max(1, Math.ceil((Date.now() - startTimeRef.current) / 1000))
        )
        chunksRef.current = []

        if (!audioBlob.size) {
          toast.error('Aucun son n’a été enregistré. Vérifiez votre microphone.')
        } else if (audioBlob.size > MAX_AUDIO_BYTES) {
          toast.error('L’enregistrement dépasse la limite de 10 Mo.')
        } else {
          onAudioReady(audioBlob, elapsedSeconds)
        }
        if (mountedRef.current) setRecordingState('idle')
      }

      recorder.start(250)
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setDuration(Math.min(elapsed, maxDurationSeconds))
        if (elapsed >= maxDurationSeconds && recorder.state === 'recording') {
          recorder.stop()
          clearTimer()
        }
      }, 250)
    } catch (error) {
      clearTimer()
      releaseStream()
      mediaRecorderRef.current = null
      if (!mountedRef.current || cancelledRef.current) return
      setRecordingState('idle')

      const name = (error as DOMException)?.name
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        toast.error('Accès au microphone refusé. Autorisez-le dans les réglages du navigateur.')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        toast.error('Aucun microphone n’a été détecté sur cet appareil.')
      } else if (name === 'Error' && error instanceof Error && error.message.includes('format audio')) {
        toast.error(error.message)
      } else if (name === 'NotSupportedError') {
        toast.error('Ce navigateur ne prend pas en charge un format d’enregistrement audio compatible.')
      } else {
        toast.error('Impossible de démarrer le microphone. Vérifiez ses réglages et réessayez.')
      }
    }
  }, [recordingState, maxDurationSeconds, onAudioReady, clearTimer, releaseStream])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
    clearTimer()
  }, [clearTimer])

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true
    requestIdRef.current += 1
    clearTimer()
    const recorder = mediaRecorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
    releaseStream()
    mediaRecorderRef.current = null
    chunksRef.current = []
    if (mountedRef.current) {
      setRecordingState('idle')
      setDuration(0)
    }
  }, [clearTimer, releaseStream])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      cancelledRef.current = true
      requestIdRef.current += 1
      clearTimer()
      const recorder = mediaRecorderRef.current
      if (recorder?.state === 'recording') recorder.stop()
      releaseStream()
    }
  }, [clearTimer, releaseStream])

  return {
    recordingState,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
