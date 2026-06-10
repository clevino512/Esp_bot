import { useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import type { Message } from '@/types'
import { sendMessage, createUserMessage, createAssistantMessage } from '@/services/chatService'

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Bonjour ! Je suis **UniBot**, l'assistant virtuel de l'ESPA.\n\nJe peux vous aider avec :\n- Les dates d'inscription\n- Les informations sur les examens\n- Les relevés de notes\n- Les bourses disponibles\n- Et d'autres questions académiques\n\nComment puis-je vous aider aujourd'hui ?",
  mode: 'text',
  timestamp: new Date(),
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const sessionId = useRef(crypto.randomUUID())

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  const sendTextMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMsg = createUserMessage(content.trim(), 'text')
    addMessage(userMsg)
    setIsLoading(true)

    const typingId = crypto.randomUUID()
    setMessages(prev => [...prev, {
      id: typingId,
      role: 'assistant',
      content: '',
      mode: 'text',
      timestamp: new Date(),
      isStreaming: true,
    }])

    try {
      const response = await sendMessage({
        message: content.trim(),
        sessionId: sessionId.current,
        mode: 'text',
      })

      setMessages(prev => prev.filter(m => m.id !== typingId))
      const assistantMsg = createAssistantMessage(response, 'text')
      addMessage(assistantMsg)
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      const error = err as { response?: { data?: { detail?: string } } }
      const message = error.response?.data?.detail || 'Erreur de connexion. Veuillez réessayer.'
      toast.error(message)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, addMessage])

  const sendVoiceMessage = useCallback(async (transcript: string) => {
    if (!transcript.trim() || isLoading) return

    const userMsg = createUserMessage(transcript.trim(), 'voice')
    addMessage(userMsg)
    setIsLoading(true)

    const typingId = crypto.randomUUID()
    setMessages(prev => [...prev, {
      id: typingId,
      role: 'assistant',
      content: '',
      mode: 'voice',
      timestamp: new Date(),
      isStreaming: true,
    }])

    try {
      const response = await sendMessage({
        message: transcript.trim(),
        sessionId: sessionId.current,
        mode: 'voice',
      })

      setMessages(prev => prev.filter(m => m.id !== typingId))
      const assistantMsg = createAssistantMessage(response, 'voice')
      addMessage(assistantMsg)
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      const error = err as { response?: { data?: { detail?: string } } }
      const message = error.response?.data?.detail || 'Erreur lors du traitement vocal.'
      toast.error(message)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, addMessage])

  const clearMessages = useCallback(() => {
    setMessages([WELCOME_MESSAGE])
    sessionId.current = crypto.randomUUID()
  }, [])

  return {
    messages,
    isLoading,
    sendTextMessage,
    sendVoiceMessage,
    clearMessages,
  }
}
