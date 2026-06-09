import type { KnowledgeDocument, ConversationLog, DashboardStats, AdminUser, AuthTokens } from '@/types'
import {
  mockDocuments,
  mockLogs,
  mockDashboardStats,
  mockAdminUser,
  generateId,
} from '@/data/mockData'

async function delay(ms = 600) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<{ user: AdminUser; tokens: AuthTokens }> {
  await delay(800)

  if (email === 'admin@espa.mg' && password === 'admin123') {
    return {
      user: mockAdminUser,
      tokens: {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        expiresIn: 3600,
      },
    }
  }

  throw new Error('Email ou mot de passe incorrect')
}

export async function logout(): Promise<void> {
  await delay(200)
}

// ── Documents ─────────────────────────────────────────────────────────────────

let localDocuments = [...mockDocuments]

export async function getDocuments(): Promise<KnowledgeDocument[]> {
  await delay()
  return [...localDocuments]
}

export async function uploadDocument(
  file: File,
  category: KnowledgeDocument['category'],
  description?: string
): Promise<KnowledgeDocument> {
  await delay(1500)

  const doc: KnowledgeDocument = {
    id: generateId(),
    title: file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
    filename: file.name,
    category,
    status: 'processing',
    chunkCount: 0,
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    size: file.size,
    description,
    tags: [category],
  }

  localDocuments = [doc, ...localDocuments]

  // Simulate processing completion after 3s
  setTimeout(() => {
    localDocuments = localDocuments.map(d =>
      d.id === doc.id
        ? { ...d, status: 'indexed', chunkCount: Math.floor(10 + Math.random() * 40) }
        : d
    )
  }, 3000)

  return doc
}

export async function deleteDocument(id: string): Promise<void> {
  await delay()
  localDocuments = localDocuments.filter(d => d.id !== id)
}

export async function reindexDocument(id: string): Promise<void> {
  await delay(2000)
  localDocuments = localDocuments.map(d =>
    d.id === id ? { ...d, status: 'indexed', updatedAt: new Date().toISOString() } : d
  )
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export async function getLogs(params?: {
  page?: number
  limit?: number
  status?: string
}): Promise<{ logs: ConversationLog[]; total: number }> {
  await delay()

  const page = params?.page ?? 1
  const limit = params?.limit ?? 10
  const statusFilter = params?.status

  let filtered = statusFilter && statusFilter !== 'all'
    ? mockLogs.filter(l => l.status === statusFilter)
    : [...mockLogs]

  const total = filtered.length
  const start = (page - 1) * limit
  const logs = filtered.slice(start, start + limit)

  return { logs, total }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay()
  return { ...mockDashboardStats }
}
