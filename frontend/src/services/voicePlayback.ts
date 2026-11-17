import type { VoicePlaybackSnapshot } from '@/types'

const idleSnapshot: VoicePlaybackSnapshot = { messageId: null, status: 'idle' }
let snapshot = idleSnapshot
let activeUtterance: SpeechSynthesisUtterance | null = null
const listeners = new Set<() => void>()

function publish(next: VoicePlaybackSnapshot) {
  snapshot = next
  listeners.forEach(listener => listener())
}

export function subscribeToVoicePlayback(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getVoicePlaybackSnapshot() {
  return snapshot
}

function stopActiveUtterance() {
  activeUtterance = null
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  publish(idleSnapshot)
}

function readableText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__|~~|[*_#>])/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function startVoicePlayback(messageId: string, text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) {
    throw new Error('La lecture vocale n’est pas disponible dans ce navigateur.')
  }
  const spokenText = readableText(text)
  if (!spokenText) throw new Error('Cette réponse ne contient pas de texte à lire.')

  stopActiveUtterance()
  const utterance = new SpeechSynthesisUtterance(spokenText)
  utterance.lang = 'fr-FR'
  utterance.rate = 1
  activeUtterance = utterance
  publish({ messageId, status: 'speaking' })
  window.dispatchEvent(new CustomEvent('unibot:speech-start'))

  const isCurrent = () => activeUtterance === utterance
  utterance.onstart = () => {
    if (isCurrent()) publish({ messageId, status: 'speaking' })
  }
  utterance.onpause = () => {
    if (isCurrent()) publish({ messageId, status: 'paused' })
  }
  utterance.onresume = () => {
    if (isCurrent()) publish({ messageId, status: 'speaking' })
  }
  utterance.onend = () => {
    if (isCurrent()) {
      activeUtterance = null
      publish(idleSnapshot)
    }
  }
  utterance.onerror = event => {
    if (isCurrent()) {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        window.dispatchEvent(
          new CustomEvent('unibot:speech-error', { detail: { messageId } })
        )
      }
      activeUtterance = null
      publish(idleSnapshot)
    }
  }
  try {
    window.speechSynthesis.speak(utterance)
  } catch (error) {
    activeUtterance = null
    publish(idleSnapshot)
    throw error
  }
}

export function pauseVoicePlayback(messageId: string) {
  if (snapshot.messageId !== messageId || snapshot.status !== 'speaking') return
  window.speechSynthesis.pause()
  publish({ messageId, status: 'paused' })
}

export function resumeVoicePlayback(messageId: string) {
  if (snapshot.messageId !== messageId || snapshot.status !== 'paused') return
  window.speechSynthesis.resume()
  publish({ messageId, status: 'speaking' })
}

export function stopVoicePlayback(messageId?: string) {
  if (messageId && snapshot.messageId !== messageId) return
  if (snapshot.status === 'idle') return
  stopActiveUtterance()
}
