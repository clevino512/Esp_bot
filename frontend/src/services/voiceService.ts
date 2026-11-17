import api from '@/lib/api'
import type { ASRResponse, ChatResponse, Source } from '@/types'

export type WhisperModel = 'tiny' | 'base' | 'medium'
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024
export const AUDIO_FILE_ACCEPT =
  '.mp3,.wav,.webm,.ogg,.m4a,audio/mpeg,audio/wav,audio/webm,audio/ogg,audio/mp4'

const AUDIO_MIME_TYPES: Record<string, string[]> = {
  mp3: ['audio/mpeg', 'audio/mp3', 'audio/x-mpeg'],
  wav: ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave'],
  webm: ['audio/webm'],
  ogg: ['audio/ogg', 'audio/opus'],
  m4a: ['audio/mp4', 'audio/m4a', 'audio/x-m4a'],
}

export function validateAudioFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const supportedTypes = AUDIO_MIME_TYPES[extension]
  if (!supportedTypes) {
    return 'Format non pris en charge. Choisissez un fichier MP3, WAV, WebM, OGG ou M4A.'
  }
  if (file.size === 0) return 'Le fichier audio est vide.'
  if (file.size > MAX_AUDIO_BYTES) return 'Le fichier audio ne doit pas dépasser 10 Mo.'

  const mimeType = file.type.split(';', 1)[0].trim().toLowerCase()
  if (!mimeType || !supportedTypes.includes(mimeType)) {
    return 'Le type du fichier ne correspond pas à un format audio pris en charge.'
  }
  return null
}

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
  const mimeType = blob.type.toLowerCase()
  if (mimeType.includes('webm')) return 'webm'
  if (mimeType.includes('ogg') || mimeType.includes('opus')) return 'ogg'
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3'
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a'
  if (mimeType.includes('wav') || mimeType.includes('wave')) return 'wav'
  throw new Error('Format audio non pris en charge par le navigateur.')
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
  studentVerification?: { fullName: string; studentIdentifier: string },
  history?: Array<{ role: string; content: string }>
): Promise<{
  transcription: { text: string; confidence: number; model?: string; processing_time_ms?: number; real_time_factor?: number | null }
  response: ChatResponse
}> {
  const formData = new FormData()
  formData.append('audio', audioBlob, `recording.${extensionForBlob(audioBlob)}`)
  formData.append('language', language)
  if (sessionId) formData.append('session_id', sessionId)
  if (history?.length) formData.append('history', JSON.stringify(history.slice(-6)))
  if (studentVerification) {
    formData.append('student_full_name', studentVerification.fullName)
    formData.append('student_identifier', studentVerification.studentIdentifier)
  }
  const { data } = await api.post<{
    transcription: { text: string; confidence: number; model?: string; processing_time_ms?: number; real_time_factor?: number | null }
    response: {
      id: string
      response: string
      sources: Array<{
        document_id: number
        document_title: string
        chunk_index: number
        content: string
        relevance_score: number
      }>
      session_id: string
      confidence: number
      is_fallback: boolean
      created_at: string
    }
  }>('/voice/chat', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  const sources: Source[] = data.response.sources.map(source => ({
    id: `${source.document_id}-${source.chunk_index}`,
    documentId: String(source.document_id),
    title: source.document_title,
    content: source.content,
    relevanceScore: source.relevance_score,
  }))

  return {
    transcription: data.transcription,
    response: {
      id: data.response.id,
      content: data.response.response,
      sources,
      confidence: data.response.confidence,
      isFallback: data.response.is_fallback,
      timestamp: data.response.created_at,
      sessionId: data.response.session_id,
    },
  }
}

export function formatAudioDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
