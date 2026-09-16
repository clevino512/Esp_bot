import api from '@/lib/api'
import type { ASRResponse } from '@/types'

export type WhisperModel = 'tiny' | 'base' | 'medium'

export interface BackendTranscriptionResponse {
  id: string
  text: string
  language: string
  duration_seconds: number
  confidence: number
  processing_time_ms?: number
  real_time_factor?: number | null
  engine?: string
  model?: string
  created_at: string
}

function extensionForBlob(blob: Blob): string {
  if (blob.type.includes('webm')) return 'webm'
  if (blob.type.includes('ogg')) return 'ogg'
  if (blob.type.includes('mpeg') || blob.type.includes('mp3')) return 'mp3'
  if (blob.type.includes('mp4') || blob.type.includes('m4a')) return 'm4a'
  if (blob.type.includes('flac')) return 'flac'
  return 'wav'
}

export async function transcribeAudio(
  audioBlob: Blob,
  language = 'fr',
  model: WhisperModel = 'base'
): Promise<ASRResponse> {
  const formData = new FormData()
  formData.append('audio', audioBlob, `recording.${extensionForBlob(audioBlob)}`)
  formData.append('language', language)
  formData.append('model', model)

  const { data } = await api.post<BackendTranscriptionResponse>('/voice/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return {
    transcript: data.text,
    confidence: data.confidence,
    language: data.language,
    duration: data.duration_seconds,
  }
}

export async function synthesizeSpeech(text: string, language = 'fr'): Promise<Blob> {
  const formData = new FormData()
  formData.append('text', text)
  formData.append('language', language)
  const response = await api.post('/voice/synthesize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  })
  return response.data
}

export async function playSpeech(text: string, language = 'fr'): Promise<void> {
  const blob = await synthesizeSpeech(text, language)
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  try {
    await audio.play()
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve()
      audio.onerror = () => reject(new Error('Lecture audio impossible'))
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function voiceChat(
  audioBlob: Blob,
  sessionId?: string,
  language = 'fr',
  studentVerification?: { fullName: string; studentIdentifier: string }
): Promise<{
  transcription: { text: string; confidence: number; model?: string; processing_time_ms?: number; real_time_factor?: number | null }
  response: {
    id: string
    content: string
    sources: Array<{ document_id: number; document_title: string; content: string; relevance_score: number }>
    confidence: number
    is_fallback: boolean
  }
}> {
  const formData = new FormData()
  formData.append('audio', audioBlob, `recording.${extensionForBlob(audioBlob)}`)
  formData.append('language', language)
  if (sessionId) formData.append('session_id', sessionId)
  if (studentVerification) {
    formData.append('student_full_name', studentVerification.fullName)
    formData.append('student_identifier', studentVerification.studentIdentifier)
  }
  const response = await api.post('/voice/chat', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export function formatAudioDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
