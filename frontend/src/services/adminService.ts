import api from '@/lib/api'
import type { KnowledgeDocument, ConversationLog, DashboardStats, AdminUser, AuthTokens } from '@/types'
import type { StudentAccess } from '@/types'

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface UserResponse {
  id: number
  email: string
  full_name: string
  role: 'admin' | 'user'
  is_active: boolean
  created_at: string
}

export async function login(
  email: string,
  password: string
): Promise<{ user: AdminUser; tokens: AuthTokens }> {

  // ── Étape 1 : Login ────────────────────────────────────────
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })

  const tokens: AuthTokens = {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresIn:    data.expires_in,
  }

  // ── Étape 2 : /auth/me avec token explicite ────────────────
  const { data: userData } = await api.get<UserResponse>('/auth/me', {
    headers: { Authorization: `Bearer ${tokens.accessToken}` }
  })

  // ── Étape 3 : Mapping du profil ────────────────────────────
  const user: AdminUser = {
    id:        userData.id.toString(),
    email:     userData.email,
    name:      userData.full_name,
    role:      userData.role,
    createdAt: userData.created_at,
  }

  return { user, tokens }
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  try {
    const response = await api.get<UserResponse>('/auth/me')
    const data = response.data
    return {
      id: data.id.toString(),
      email: data.email,
      name: data.full_name,
      role: data.role,
      createdAt: data.created_at,
    }
  } catch {
    return null
  }
}

// ── Documents ─────────────────────────────────────────────────────────────────

export interface BackendDocument {
  id: number
  title: string
  filename: string | null
  category: string
  chunk_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getDocuments(params?: {
  page?: number
  pageSize?: number
  category?: string
  isActive?: boolean
}): Promise<{ documents: KnowledgeDocument[]; total: number }> {
  const response = await api.get<{
    documents: BackendDocument[]
    total: number
    page: number
    page_size: number
    total_pages: number
  }>('/admin/documents', { params })

  const documents: KnowledgeDocument[] = response.data.documents.map((d) => ({
    id: d.id.toString(),
    title: d.title,
    filename: d.filename || undefined,
    category: d.category as KnowledgeDocument['category'],
    status: d.is_active ? 'indexed' : 'pending',
    chunkCount: d.chunk_count,
    uploadedAt: d.created_at,
    updatedAt: d.updated_at,
  }))

  return {
    documents,
    total: response.data.total,
  }
}

export async function uploadDocument(
  file: File,
  category: KnowledgeDocument['category'],
  description?: string
): Promise<KnowledgeDocument> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)
  if (description) {
    formData.append('title', description)
  }

  const response = await api.post<BackendDocument>('/admin/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  const data = response.data
  return {
    id: data.id.toString(),
    title: data.title,
    filename: data.filename || undefined,
    category: data.category as KnowledgeDocument['category'],
    status: data.is_active ? 'indexed' : 'pending',
    chunkCount: data.chunk_count,
    uploadedAt: data.created_at,
    updatedAt: data.updated_at,
    description,
  }
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/admin/documents/${id}`)
}

export async function reindexDocument(id: string): Promise<void> {
  await api.post(`/admin/documents/${id}/reindex`)
}

export async function getDocumentStats(): Promise<{
  totalDocuments: number
  activeDocuments: number
  totalChunks: number
}> {
  const response = await api.get<{
    total_documents: number
    active_documents: number
    total_chunks: number
  }>('/admin/stats')
  return {
    totalDocuments: response.data.total_documents,
    activeDocuments: response.data.active_documents,
    totalChunks: response.data.total_chunks,
  }
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export interface BackendConversationLog {
  id: string
  session_id: string
  user_query: string
  bot_response: string
  sources: any[]
  confidence: number
  is_fallback: boolean
  feedback: 'helpful' | 'not_helpful' | null
  response_time_ms: number
  created_at: string
}

export async function getLogs(params?: {
  page?: number
  pageSize?: number
  sessionId?: string
}): Promise<{ logs: ConversationLog[]; total: number }> {
  const response = await api.get<{
    logs: BackendConversationLog[]
    total: number
    page: number
    page_size: number
  }>('/admin/conversations', {
    params: {
      page: params?.page,
      page_size: params?.pageSize,
    },
  })

  const logs: ConversationLog[] = response.data.logs.map((l) => ({
    id: l.id,
    sessionId: l.session_id,
    query: l.user_query || '',
    response: l.bot_response,
    sources: l.sources || [],
    confidence: l.confidence,
    isFallback: l.is_fallback,
    feedback: l.feedback,
    responseTime: l.response_time_ms,
    timestamp: l.created_at,
    status: l.is_fallback ? 'fallback' : 'answered',
  }))

  return {
    logs,
    total: response.data.total,
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface BackendDashboardStats {
  total_conversations: number
  unique_users: number
  avg_response_time_ms: number
  avg_confidence_score: number
  fallback_rate: number
  helpful_rate: number
  active_documents: number
  total_chunks: number
  period_start: string
  period_end: string
}

export async function getDashboardStats(days = 7): Promise<DashboardStats> {
  const response = await api.get<BackendDashboardStats>('/admin/dashboard', {
    params: { days },
  })

  const data = response.data
  return {
    totalConversations: data.total_conversations,
    uniqueUsers: data.unique_users,
    avgResponseTime: data.avg_response_time_ms,
    avgConfidence: data.avg_confidence_score,
    fallbackRate: data.fallback_rate,
    helpfulRate: data.helpful_rate,
    totalDocuments: data.active_documents,
    activeDocuments: data.active_documents,
    totalChunks: data.total_chunks,
    periodStart: data.period_start,
    periodEnd: data.period_end,
  }
}

export interface FallbackQuestion {
  question: string
  count: number
  last_seen: string
}

export async function getFallbackQuestions(days = 30, limit = 10): Promise<FallbackQuestion[]> {
  const response = await api.get<FallbackQuestion[]>('/admin/fallback-questions', {
    params: { days, limit },
  })
  return response.data
}

export async function getTopQuestions(days = 7, limit = 10): Promise<{ question: string; count: number }[]> {
  const response = await api.get<{ question: string; count: number }[]>('/admin/top-questions', {
    params: { days, limit },
  })
  return response.data
}

// ── Student access registry ──────────────────────────────────────────────────

interface BackendStudentAccess {
  id: number
  full_name: string
  masked_identifier: string
  is_active: boolean
  created_at: string
  updated_at: string
}

function mapStudentAccess(student: BackendStudentAccess): StudentAccess {
  return {
    id: student.id,
    fullName: student.full_name,
    maskedIdentifier: student.masked_identifier,
    isActive: student.is_active,
    createdAt: student.created_at,
    updatedAt: student.updated_at,
  }
}

export async function getStudentAccessList(): Promise<StudentAccess[]> {
  const response = await api.get<BackendStudentAccess[]>('/admin/students')
  return response.data.map(mapStudentAccess)
}

export async function createStudentAccess(
  fullName: string,
  studentIdentifier: string
): Promise<StudentAccess> {
  const response = await api.post<BackendStudentAccess>('/admin/students', {
    full_name: fullName,
    student_identifier: studentIdentifier,
  })
  return mapStudentAccess(response.data)
}

export async function setStudentAccessActive(
  id: number,
  isActive: boolean
): Promise<StudentAccess> {
  const response = await api.patch<BackendStudentAccess>(`/admin/students/${id}`, {
    is_active: isActive,
  })
  return mapStudentAccess(response.data)
}

export async function deleteStudentAccess(id: number): Promise<void> {
  await api.delete(`/admin/students/${id}`)
}
