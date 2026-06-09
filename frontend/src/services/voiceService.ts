import type { ASRResponse } from '@/types'

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function transcribeAudio(_audioBlob: Blob): Promise<ASRResponse> {
  // Simulated ASR response
  await delay(1500 + Math.random() * 1000)

  const mockTranscripts = [
    'Quelles sont les dates d\'inscription pour cette année ?',
    'Comment obtenir mon relevé de notes ?',
    'Quand sont les examens du premier semestre ?',
    'Quels documents faut-il pour s\'inscrire en master ?',
    'Y a-t-il des bourses disponibles pour les étudiants ?',
  ]

  const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]

  return {
    transcript,
    confidence: 0.85 + Math.random() * 0.1,
    language: 'fr',
    duration: 2.5 + Math.random() * 3,
  }
}

export async function synthesizeSpeech(_text: string): Promise<string> {
  // Returns a mock audio URL (in production would return a blob URL)
  await delay(500)
  return ''
}

export function formatAudioDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
