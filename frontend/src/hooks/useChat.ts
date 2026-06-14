import { useState, useCallback, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { Message } from '@/types'
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

  const sendTextMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      const userMsg = createUserMessage(content.trim(), 'text')
      addMessage(userMsg)
      setIsLoading(true)

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
        })
        setMessages(prev => prev.filter(m => m.id !== typingId))
        addMessage(createAssistantMessage(response, 'text'))
      } catch (err) {
        setMessages(prev => prev.filter(m => m.id !== typingId))
        const error = err as { response?: { data?: { detail?: string } } }
        toast.error(
          error.response?.data?.detail ||
            'Erreur de connexion. Vérifiez que le serveur est démarré.'
        )
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, addMessage]
  )

  const sendVoiceMessage = useCallback(
    async (transcript: string) => {
      if (!transcript.trim() || isLoading) return

      const userMsg = createUserMessage(transcript.trim(), 'voice')
      addMessage(userMsg)
      setIsLoading(true)

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
    [isLoading, addMessage]
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
