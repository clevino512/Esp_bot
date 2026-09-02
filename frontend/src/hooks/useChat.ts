import { useState, useCallback, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { Message } from '@/types'
import type { ChatRequest } from '@/types'
import {
  sendMessage,
  createUserMessage,
  createAssistantMessage,
  submitFeedback,
  getConversationHistory,
} from '@/services/chatService'

const SESSION_KEY = 'unibot_session_id'
const SESSION_DATE_KEY = 'unibot_session_date'

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Bonjour ! Je suis **UniBot**, l'assistant virtuel de l'ESPA.\n\nJe peux vous aider avec :\n- Les dates d'inscription\n- Les informations sur les examens\n- Les relevés de notes\n- Les bourses disponibles\n- Et d'autres questions académiques\n\nComment puis-je vous aider aujourd'hui ?",
  mode: 'text',
  timestamp: new Date(),
}

function getOrCreateSessionId(): string {
  const stored = localStorage.getItem(SESSION_KEY)
  if (stored) return stored
  const newId = crypto.randomUUID()
  localStorage.setItem(SESSION_KEY, newId)
  localStorage.setItem(SESSION_DATE_KEY, new Date().toISOString())
  return newId
}

function getSessionDate(): Date | null {
  const stored = localStorage.getItem(SESSION_DATE_KEY)
  return stored ? new Date(stored) : null
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const [historyRestored, setHistoryRestored] = useState(false)
  const [restoredMessageCount, setRestoredMessageCount] = useState(0)
  const [restoredFromDate, setRestoredFromDate] = useState<Date | null>(null)
  const sessionId = useRef<string>(getOrCreateSessionId())
  // Keep a ref so sendTextMessage / sendVoiceMessage can read the latest
  // messages without being stale (avoids adding `messages` to dep arrays).
  const messagesRef = useRef(messages)
  useEffect(() => {
    messagesRef.current = messages
  })

  useEffect(() => {
    const sid = sessionId.current
    getConversationHistory(sid)
      .then(({ messages: history }) => {
        if (history.length > 0) {
          const restored: Message[] = history.map(m => ({
            ...m,
            timestamp:
              m.timestamp instanceof Date
                ? m.timestamp
                : new Date(m.timestamp as unknown as string),
          }))
          setMessages([WELCOME_MESSAGE, ...restored])
          setRestoredMessageCount(restored.length)
          const firstTs = restored[0]?.timestamp
          setRestoredFromDate(firstTs instanceof Date ? firstTs : null)
        }
        setHistoryRestored(true)
      })
      .catch(() => {
        setHistoryRestored(true)
      })
  }, [])

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  /**
   * Build a history array for the backend LLM from current messages.
   * We skip the static welcome message (id='welcome') and streaming placeholders.
   * We keep the last 6 real messages (3 Q/A turns) to limit context size.
   */
  const buildHistory = useCallback(
    (currentMessages: Message[]): Array<{ role: string; content: string }> =>
      currentMessages
        .filter(m => m.id !== 'welcome' && !m.isStreaming && m.content.trim())
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content })),
    []
  )

  const sendTextMessage = useCallback(
    async (
      content: string,
      studentVerification?: ChatRequest['studentVerification']
    ) => {
      if (!content.trim() || isLoading) return

      const userMsg = createUserMessage(content.trim(), 'text')
      addMessage(userMsg)
      setIsLoading(true)

      // Snapshot messages BEFORE adding the typing indicator so history is clean.
      // Use messagesRef.current to get the latest value without stale closure.
      const historySnapshot = buildHistory([...messagesRef.current, userMsg])

      const typingId = crypto.randomUUID()
      setMessages(prev => [
        ...prev,
        {
          id: typingId,
          role: 'assistant',
          content: '',
          mode: 'text',
          timestamp: new Date(),
          isStreaming: true,
        },
      ])

      try {
        const response = await sendMessage({
          message: content.trim(),
          sessionId: sessionId.current,
          mode: 'text',
          history: historySnapshot,
          studentVerification,
        })
        setMessages(prev => prev.filter(m => m.id !== typingId))
        addMessage(createAssistantMessage(response, 'text'))
      } catch (err) {
        setMessages(prev => prev.filter(m => m.id !== typingId))
        const error = err as {
          response?: {
            data?: { detail?: string; error?: string | { message?: string } }
            status?: number
          }
          code?: string
          message?: string
        }

        const backendErrorMessage =
          typeof error.response?.data?.error === 'string'
            ? error.response.data.error
            : error.response?.data?.error?.message || error.response?.data?.detail

        const timeoutMessage =
          error.code === 'ECONNABORTED' || error.message?.includes('timeout')
            ? 'Le serveur met trop de temps à répondre. Réessayez dans quelques secondes.'
            : undefined

        toast.error(
          backendErrorMessage || timeoutMessage || 'Erreur de connexion. Vérifiez que le serveur est démarré.'
        )
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, addMessage, buildHistory]
  )

  const sendVoiceMessage = useCallback(
    async (
      transcript: string,
      studentVerification?: ChatRequest['studentVerification']
    ) => {
      if (!transcript.trim() || isLoading) return

      const userMsg = createUserMessage(transcript.trim(), 'voice')
      addMessage(userMsg)
      setIsLoading(true)

      const historySnapshot = buildHistory([...messagesRef.current, userMsg])

      const typingId = crypto.randomUUID()
      setMessages(prev => [
        ...prev,
        {
          id: typingId,
          role: 'assistant',
          content: '',
          mode: 'voice',
          timestamp: new Date(),
          isStreaming: true,
        },
      ])

      try {
        const response = await sendMessage({
          message: transcript.trim(),
          sessionId: sessionId.current,
          mode: 'voice',
          history: historySnapshot,
          studentVerification,
        })
        setMessages(prev => prev.filter(m => m.id !== typingId))
        addMessage(createAssistantMessage(response, 'voice'))
      } catch (err) {
        setMessages(prev => prev.filter(m => m.id !== typingId))
        const error = err as { response?: { data?: { detail?: string } } }
        toast.error(
          error.response?.data?.detail || 'Erreur lors du traitement vocal.'
        )
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, addMessage, buildHistory]
  )

  const handleFeedback = useCallback(
    async (messageId: string, feedback: 'helpful' | 'not_helpful') => {
      try {
        await submitFeedback(messageId, feedback)
        toast.success(
          feedback === 'helpful' ? 'Merci pour votre retour !' : 'Retour enregistré.'
        )
        setMessages(prev =>
          prev.map(m => (m.id === messageId ? { ...m, feedback } : m))
        )
      } catch {
        toast.error("Impossible d'enregistrer le retour.")
      }
    },
    []
  )

  const clearMessages = useCallback(() => {
    const newId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, newId)
    localStorage.setItem(SESSION_DATE_KEY, new Date().toISOString())
    localStorage.removeItem('unibot_sus_submitted')
    sessionId.current = newId
    setMessages([WELCOME_MESSAGE])
    setHistoryRestored(false)
    setRestoredMessageCount(0)
    setRestoredFromDate(null)
  }, [])

  return {
    messages,
    isLoading,
    historyRestored,
    restoredMessageCount,
    restoredFromDate,
    sessionStartedAt: getSessionDate(),
    sessionId: sessionId.current,
    sendTextMessage,
    sendVoiceMessage,
    handleFeedback,
    clearMessages,
  }
}
