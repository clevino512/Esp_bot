import type { ChatRequest, ChatResponse, Message } from '@/types'
import { generateId, getMockResponse } from '@/data/mockData'

const SIMULATED_DELAY = 800 + Math.random() * 1200

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  await delay(SIMULATED_DELAY)

  const { content, sources, confidence } = getMockResponse(request.message)

  return {
    id: generateId(),
    content,
    sources,
    confidence,
    isFallback: confidence < 0.5,
    timestamp: new Date().toISOString(),
  }
}

export function createUserMessage(content: string, mode: Message['mode'] = 'text'): Message {
  return {
    id: generateId(),
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
