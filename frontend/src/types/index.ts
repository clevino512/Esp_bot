// ── Chat ──────────────────────────────────────────────────────────────────────

export interface Source {
  id: string
  documentId?: string
  title?: string
  document?: string
  category?: string
  page?: number
  relevanceScore: number
  content?: string
  excerpt?: string
  isPublic?: boolean
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
  feedback?: 'helpful' | 'not_helpful' | null
}

export interface ChatRequest {
  message: string
  sessionId?: string
  mode?: MessageMode
  history?: Array<{ role: string; content: string }>
}

export interface ChatResponse {
  id: string
  content: string
  sources: Source[]
  confidence: number
  isFallback: boolean
  timestamp: string
  sessionId?: string
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

export type DocumentCategory = 'admission' | 'inscription' | 'examens' | 'notes' | 'boursers' | 'stages' | 'diplomes' | 'emploi_du_temps' | 'reglement' | 'general'
export type DocumentStatus = 'indexed' | 'processing' | 'error' | 'pending'

export interface KnowledgeDocument {
  id: string
  title: string
  filename?: string
  category: DocumentCategory
  status: DocumentStatus
  chunkCount: number
  uploadedAt: string
  updatedAt: string
  size?: number
  description?: string
  tags?: string[]
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

export type ConversationStatus = 'resolved' | 'unresolved' | 'fallback' | 'escalated' | 'answered'

export interface ConversationLog {
  id: string
  sessionId: string
  query?: string
  userQuestion?: string
  response?: string
  botResponse?: string
  sources: string[] | Source[]
  confidence: number
  status: ConversationStatus
  isFallback?: boolean
  mode?: MessageMode
  timestamp: string
  responseTime?: number
  feedback?: 'helpful' | 'not_helpful' | 'positive' | 'negative' | null
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
  uniqueUsers?: number
  resolvedRate?: number
  avgResponseTime: number
  avgConfidence?: number
  voiceUsageRate?: number
  fallbackRate?: number
  helpfulRate?: number
  totalDocuments: number
  activeDocuments?: number
  totalChunks: number
  mrr5Score?: number
  activeSessionsToday?: number
  dailyStats?: DailyStats[]
  categoryStats?: CategoryStats[]
  topQuestions?: { question: string; count: number }[]
  periodStart?: string
  periodEnd?: string
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'super_admin' | 'viewer'
  lastLogin?: string
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

// ── Settings ──────────────────────────────────────────────────────────────────

export interface AppSettings {
  top_k: number
  min_score: number
  fallback_threshold: number
  chunk_size: number
  chunk_overlap: number
  llm_provider: string
  llm_model: string
  max_tokens: number
  temperature: number
  notify_fallback: boolean
  notify_weekly_report: boolean
}
