import api from '@/lib/api'
import type { ChatRequest, ChatResponse, Message, Source } from '@/types'

export interface BackendChatResponse {
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

export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await api.post<BackendChatResponse>('/chat/message', {
    message: request.message,
    session_id: request.sessionId || undefined,
    history: request.history || undefined,
  })

  const data = response.data

  const sources: Source[] = data.sources.map((s) => ({
    id: s.document_id.toString(),
    documentId: s.document_id.toString(),
    title: s.document_title,
    content: s.content,
    relevanceScore: s.relevance_score,
  }))

  return {
    id: data.id,
    content: data.response,
    sources,
    confidence: data.confidence,
    isFallback: data.is_fallback,
    timestamp: data.created_at,
    sessionId: data.session_id,
  }
}

export async function getConversationHistory(sessionId: string): Promise<{
  sessionId: string
  messages: Message[]
}> {
  const response = await api.get<{
    session_id: string
    messages: Array<{
      id: string
      role: string
      content: string
      sources: Array<{
        document_id: number
        document_title: string
        content: string
        relevance_score: number
      }> | null
      feedback: 'helpful' | 'not_helpful' | null
      created_at: string
    }>
  }>(`/chat/history/${sessionId}`)

  const messages: Message[] = response.data.messages.map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    mode: 'text' as const,
    timestamp: new Date(m.created_at),
    sources: m.sources?.map((s) => ({
      id: s.document_id.toString(),
      documentId: s.document_id.toString(),
      title: s.document_title,
      content: s.content,
      relevanceScore: s.relevance_score,
    })),
    feedback: m.feedback,
  }))

  return {
    sessionId: response.data.session_id,
    messages,
  }
}

export async function submitFeedback(
  messageId: string,
  feedback: 'helpful' | 'not_helpful'
): Promise<void> {
  await api.post('/chat/feedback', {
    message_id: messageId,
    feedback,
  })
}

export async function clearConversation(sessionId: string): Promise<void> {
  await api.delete(`/chat/conversation/${sessionId}`)
}

export function createUserMessage(content: string, mode: Message['mode'] = 'text'): Message {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    mode,
    timestamp: new Date(),
  }
}

export function createAssistantMessage(response: ChatResponse, mode: Message['mode'] = 'text'): Message {
  return {
    id: response.id,
    role: 'assistant',
    content: response.content,
    mode,
    timestamp: new Date(response.timestamp),
    sources: response.sources,
    confidence: response.confidence,
  }
}
