import type {
  KnowledgeDocument,
  ConversationLog,
  DashboardStats,
  AdminUser,
  Message,
  Source,
} from '@/types'

// ── Mock Sources ──────────────────────────────────────────────────────────────

export const mockSources: Source[] = [
  {
    id: 's1',
    document: 'Reglement des etudes ESPA 2025-2026',
    category: 'reglement',
    page: 12,
    relevanceScore: 0.92,
    excerpt: 'Les etudiants doivent obtenir une moyenne generale minimale de 10/20 pour valider leur semestre...',
  },
  {
    id: 's2',
    document: 'Calendrier academique 2025-2026',
    category: 'general',
    page: 3,
    relevanceScore: 0.87,
    excerpt: 'La rentree des classes est fixee au 15 septembre 2025. Les examens de fin de semestre se derouleront...',
  },
  {
    id: 's3',
    document: 'Guide des procedures administratives',
    category: 'inscription',
    page: 7,
    relevanceScore: 0.81,
    excerpt: 'Pour obtenir votre releve de notes, vous devez vous presenter a la scolarite avec votre carte etudiant...',
  },
  {
    id: 's4',
    document: 'FAQ Etudiants ESPA',
    category: 'general',
    relevanceScore: 0.78,
    excerpt: 'Les inscriptions sont ouvertes du 1er juillet au 31 aout. Pour les etudiants en reinscription...',
  },
]

// ── Mock Messages (Initial Chat) ──────────────────────────────────────────────

export const mockWelcomeMessages: Message[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content: `Bonjour ! Je suis **UniBot**, votre assistant universitaire a l'ESPA Antsiranana.

Je peux vous aider avec :
- Les **reglements** et procedures administratives
- Les **calendriers** academiques et dates importantes
- Les **inscriptions** et reinscriptions
- Les **examens** et resultats
- Toute question concernant la vie universitaire a l'ESPA

Comment puis-je vous aider aujourd'hui ?`,
    mode: 'text',
    timestamp: new Date(Date.now() - 1000),
    confidence: 1.0,
  },
]

// ── Mock Documents ────────────────────────────────────────────────────────────

export const mockDocuments: KnowledgeDocument[] = [
  {
    id: 'doc-1',
    title: 'Reglement des etudes ESPA 2025-2026',
    filename: 'reglement_etudes_2025-2026.pdf',
    category: 'reglement',
    status: 'indexed',
    chunkCount: 47,
    uploadedAt: '2025-09-01T08:00:00Z',
    updatedAt: '2025-09-01T08:45:00Z',
    size: 2457600,
    description: 'Reglement officiel des etudes pour l\'annee academique 2025-2026',
  },
  {
    id: 'doc-2',
    title: 'Calendrier academique 2025-2026',
    filename: 'calendrier_academique_2025-2026.pdf',
    category: 'general',
    status: 'indexed',
    chunkCount: 12,
    uploadedAt: '2025-09-01T09:00:00Z',
    updatedAt: '2025-09-01T09:10:00Z',
    size: 512000,
    description: 'Calendrier officiel des cours, examens et conges',
  },
  {
    id: 'doc-3',
    title: 'Guide des procedures administratives',
    filename: 'guide_procedures_admin.pdf',
    category: 'inscription',
    status: 'indexed',
    chunkCount: 35,
    uploadedAt: '2025-09-02T10:00:00Z',
    updatedAt: '2025-09-02T10:30:00Z',
    size: 1843200,
    description: 'Guide complet des procedures administratives pour etudiants',
  },
  {
    id: 'doc-4',
    title: 'FAQ Etudiants ESPA',
    filename: 'faq_etudiants.pdf',
    category: 'general',
    status: 'indexed',
    chunkCount: 28,
    uploadedAt: '2025-09-03T11:00:00Z',
    updatedAt: '2025-09-10T14:00:00Z',
    size: 921600,
    description: 'Foire aux questions des etudiants de l\'ESPA',
  },
]

// ── Mock Conversation Logs ────────────────────────────────────────────────────

export const mockLogs: ConversationLog[] = [
  {
    id: 'log-1',
    sessionId: 'sess-abc123',
    userQuestion: 'Quelles sont les dates d\'inscription pour 2025-2026 ?',
    botResponse: 'Les inscriptions sont ouvertes du 1er juillet au 31 aout 2025...',
    sources: [mockSources[3], mockSources[2]],
    confidence: 0.91,
    status: 'resolved',
    mode: 'text',
    timestamp: '2025-11-08T14:32:10Z',
    responseTime: 1240,
    feedback: 'positive',
  },
  {
    id: 'log-2',
    sessionId: 'sess-def456',
    userQuestion: 'Comment obtenir mon releve de notes ?',
    botResponse: 'Pour obtenir votre releve de notes, vous devez vous presenter a la scolarite...',
    sources: [mockSources[2]],
    confidence: 0.88,
    status: 'resolved',
    mode: 'voice',
    timestamp: '2025-11-08T14:45:22Z',
    responseTime: 2100,
    feedback: 'positive',
  },
  {
    id: 'log-3',
    sessionId: 'sess-ghi789',
    userQuestion: 'Quelles sont les notes minimales pour valider l\'annee ?',
    botResponse: 'Pour valider votre annee, vous devez obtenir une moyenne generale de 10/20...',
    sources: [mockSources[0]],
    confidence: 0.94,
    status: 'resolved',
    mode: 'text',
    timestamp: '2025-11-08T15:10:05Z',
    responseTime: 987,
    feedback: 'positive',
  },
  {
    id: 'log-4',
    sessionId: 'sess-jkl012',
    userQuestion: 'Est-ce qu\'il y a des cours le samedi ?',
    botResponse: 'Je n\'ai pas trouve d\'information precise sur ce sujet dans ma base de connaissances...',
    sources: [],
    confidence: 0.32,
    status: 'fallback',
    mode: 'text',
    timestamp: '2025-11-08T15:22:33Z',
    responseTime: 756,
    feedback: 'negative',
  },
  {
    id: 'log-5',
    sessionId: 'sess-mno345',
    userQuestion: 'Comment me connecter au wifi du campus ?',
    botResponse: 'Je n\'ai pas d\'information specifique sur la connexion wifi dans mes documents...',
    sources: [],
    confidence: 0.28,
    status: 'fallback',
    mode: 'text',
    timestamp: '2025-11-08T15:45:18Z',
    responseTime: 645,
  },
]

// ── Mock Dashboard Stats ──────────────────────────────────────────────────────

export const mockDashboardStats: DashboardStats = {
  totalConversations: 156,
  uniqueUsers: 42,
  avgResponseTime: 1420,
  avgConfidence: 0.84,
  fallbackRate: 0.12,
  helpfulRate: 0.78,
  totalDocuments: 8,
  activeDocuments: 7,
  totalChunks: 245,
  periodStart: '2025-11-01T00:00:00Z',
  periodEnd: '2025-11-08T23:59:59Z',
}

// ── Mock Admin User ────────────────────────────────────────────────────────────

export const mockAdminUser: AdminUser = {
  id: 'u1',
  email: 'admin@espa.mg',
  name: 'Administrateur ESPA',
  role: 'admin',
  lastLogin: new Date().toISOString(),
  createdAt: '2025-01-01T00:00:00Z',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function generateId(): string {
  return crypto.randomUUID()
}

export function getMockResponse(message: string): { content: string; sources: Source[]; confidence: number } {
  const lowerMsg = message.toLowerCase()

  if (lowerMsg.includes('inscription') || lowerMsg.includes('inscrire')) {
    return {
      content: `Pour vous **inscrire ou vous reinscrire** a l'ESPA Antsiranana, voici la procedure :

1. **Documents requis :**
   - Releve de notes du baccalaureat
   - Copie de la carte nationale d'identite
   - 4 photos d'identite recentes
   - Attestation medicale

2. **Periode d'inscription :** du **1er juillet au 31 aout 2025**

3. **Lieu :** Service de la scolarite, batiment administratif`,
      sources: mockSources.slice(0, 2),
      confidence: 0.91,
    }
  }

  if (lowerMsg.includes('examen') || lowerMsg.includes('note')) {
    return {
      content: `**Calendrier des examens 2025-2026 :**
- Examens du **1er semestre** : 15 - 26 janvier 2026
- Examens du **2eme semestre** : 15 - 26 juin 2026

**Pour valider votre annee :**
- Moyenne generale >= **10/20**`,
      sources: [mockSources[0]],
      confidence: 0.88,
    }
  }

  return {
    content: 'Je suis la pour vous aider ! Posez-moi vos questions sur les procedures administratives, les examens, ou toute autre information concernant l\'ESPA.',
    sources: [],
    confidence: 0.5,
  }
}
