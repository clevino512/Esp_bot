// ── Chat ──────────────────────────────────────────────────────────────────────

export interface Source {
  id: string
  document: string
  category: string
  page?: number
  relevanceScore: number
  excerpt: string
}

export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageMode = 'text' | 'voice'

export interface Message {
  id: string
  role: MessageRole
  content: string
  mode: MessageMode
  timestamp: Date
  sources?: Source[]
  confidence?: number
  audioUrl?: string
  isStreaming?: boolean
}

export interface ChatRequest {
  message: string
  sessionId: string
  mode?: MessageMode
}

export interface ChatResponse {
  id: string
  content: string
  sources: Source[]
  confidence: number
  isFallback: boolean
  timestamp: string
}

// ── Voice ─────────────────────────────────────────────────────────────────────

export interface ASRResponse {
  transcript: string
  confidence: number
  language: string
  duration: number
}

export interface TTSRequest {
  text: string
  language?: string
  engine?: 'gtts' | 'coqui'
}

export type RecordingState = 'idle' | 'requesting' | 'recording' | 'processing' | 'error'

// ── Documents ─────────────────────────────────────────────────────────────────

export type DocumentCategory = 'reglements' | 'calendriers' | 'procedures' | 'faq' | 'guides' | 'autres'
export type DocumentStatus = 'indexed' | 'processing' | 'error' | 'pending'

export interface KnowledgeDocument {
  id: string
  title: string
  filename: string
  category: DocumentCategory
  status: DocumentStatus
  chunkCount: number
  uploadedAt: string
  updatedAt: string
  size: number
  description?: string
  tags: string[]
}

export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  index: number
  tokenCount: number
  metadata: Record<string, string>
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export type ConversationStatus = 'resolved' | 'unresolved' | 'fallback' | 'escalated'

export interface ConversationLog {
  id: string
  sessionId: string
  userQuestion: string
  botResponse: string
  sources: Source[]
  confidence: number
  status: ConversationStatus
  mode: MessageMode
  timestamp: string
  responseTime: number
  feedback?: 'positive' | 'negative'
}

// ── Statistics ────────────────────────────────────────────────────────────────

export interface DailyStats {
  date: string
  conversations: number
  resolvedCount: number
  fallbackCount: number
  avgResponseTime: number
  voiceUsage: number
}

export interface CategoryStats {
  category: DocumentCategory
  queryCount: number
  percentage: number
}

export interface DashboardStats {
  totalConversations: number
  resolvedRate: number
  avgResponseTime: number
  voiceUsageRate: number
  totalDocuments: number
  totalChunks: number
  mrr5Score: number
  activeSessionsToday: number
  dailyStats: DailyStats[]
  categoryStats: CategoryStats[]
  topQuestions: { question: string; count: number }[]
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'viewer'
  lastLogin: string
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthState {
  user: AdminUser | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
}

// ── UI ────────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark'
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface PaginationParams {
  page: number
  limit: number
  total: number
}

export interface ApiError {
  message: string
  code: string
  status: number
}
