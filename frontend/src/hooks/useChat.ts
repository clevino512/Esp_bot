import { useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import type { Message } from '@/types'
import { mockWelcomeMessages, generateId } from '@/data/mockData'
import { sendMessage, createUserMessage, createAssistantMessage } from '@/services/chatService'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>(mockWelcomeMessages)
  const [isLoading, setIsLoading] = useState(false)
  const sessionId = useRef(generateId())

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  const sendTextMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMsg = createUserMessage(content.trim(), 'text')
    addMessage(userMsg)
    setIsLoading(true)

    // Optimistic typing indicator
    const typingId = generateId()
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
      toast.error('Erreur de connexion. Veuillez réessayer.')
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

    const typingId = generateId()
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
      toast.error('Erreur lors du traitement vocal.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, addMessage])

  const clearMessages = useCallback(() => {
    setMessages(mockWelcomeMessages)
    sessionId.current = generateId()
  }, [])

  return {
    messages,
    isLoading,
    sendTextMessage,
    sendVoiceMessage,
    clearMessages,
  }
}
