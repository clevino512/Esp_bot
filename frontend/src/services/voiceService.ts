import api from '@/lib/api'
import type { ASRResponse } from '@/types'

export interface BackendTranscriptionResponse {
  id: string
  text: string
  language: string
  duration_seconds: number
  confidence: number
  created_at: string
}

export async function transcribeAudio(audioBlob: Blob, language = 'fr'): Promise<ASRResponse> {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.wav')
  formData.append('language', language)

  const response = await api.post<BackendTranscriptionResponse>(
    '/voice/transcribe',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )

  const data = response.data

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
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob',
  })

  return response.data
}

export async function voiceChat(
  audioBlob: Blob,
  sessionId?: string,
  language = 'fr'
): Promise<{
  transcription: { text: string; confidence: number }
  response: {
    id: string
    content: string
    sources: Array<{
      document_id: number
      document_title: string
      content: string
      relevance_score: number
    }>
    confidence: number
    is_fallback: boolean
  }
}> {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.wav')
  formData.append('language', language)
  if (sessionId) {
    formData.append('session_id', sessionId)
  }

  const response = await api.post<{
    transcription: { text: string; confidence: number }
    response: {
      id: string
      content: string
      sources: Array<{
        document_id: number
        document_title: string
        content: string
        relevance_score: number
      }>
      confidence: number
      is_fallback: boolean
    }
  }>('/voice/chat', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export function formatAudioDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function getAudioUrl(text: string): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
  return `${apiBaseUrl}/voice/synthesize?text=${encodeURIComponent(text)}`
}
