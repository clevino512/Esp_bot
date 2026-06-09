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
    document: 'Règlement des études ESPA 2025-2026',
    category: 'reglements',
    page: 12,
    relevanceScore: 0.92,
    excerpt: 'Les étudiants doivent obtenir une moyenne générale minimale de 10/20 pour valider leur semestre...',
  },
  {
    id: 's2',
    document: 'Calendrier académique 2025-2026',
    category: 'calendriers',
    page: 3,
    relevanceScore: 0.87,
    excerpt: 'La rentrée des classes est fixée au 15 septembre 2025. Les examens de fin de semestre se dérouleront...',
  },
  {
    id: 's3',
    document: 'Guide des procédures administratives',
    category: 'procedures',
    page: 7,
    relevanceScore: 0.81,
    excerpt: 'Pour obtenir votre relevé de notes, vous devez vous présenter à la scolarité avec votre carte étudiant...',
  },
  {
    id: 's4',
    document: 'FAQ Étudiants ESPA',
    category: 'faq',
    relevanceScore: 0.78,
    excerpt: 'Les inscriptions sont ouvertes du 1er juillet au 31 août. Pour les étudiants en réinscription...',
  },
]

// ── Mock Messages (Initial Chat) ──────────────────────────────────────────────

export const mockWelcomeMessages: Message[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content: `Bonjour ! Je suis **UniBot**, votre assistant universitaire à l'ESPA Antsiranana.

Je peux vous aider avec :
- Les **règlements** et procédures administratives
- Les **calendriers** académiques et dates importantes
- Les **inscriptions** et réinscriptions
- Les **examens** et résultats
- Toute question concernant la vie universitaire à l'ESPA

Comment puis-je vous aider aujourd'hui ?`,
    mode: 'text',
    timestamp: new Date(Date.now() - 1000),
    confidence: 1.0,
  },
]

// ── Mock Responses ────────────────────────────────────────────────────────────

export const mockResponses: { keywords: string[]; response: string; sources: Source[] }[] = [
  {
    keywords: ['inscription', 'inscrire', 'inscription', 'réinscription'],
    response: `Pour vous **inscrire ou vous réinscrire** à l'ESPA Antsiranana, voici la procédure :

1. **Documents requis :**
   - Relevé de notes du baccalauréat (ou de l'année précédente)
   - Copie de la carte nationale d'identité
   - 4 photos d'identité récentes
   - Attestation médicale de moins de 3 mois

2. **Période d'inscription :** du **1er juillet au 31 août 2025**

3. **Lieu :** Service de la scolarité, bâtiment administratif, ouvert du lundi au vendredi de 8h à 12h et de 14h à 17h

4. **Frais de scolarité :** à régler auprès de la caisse universitaire

Pour tout renseignement complémentaire, contactez la scolarité au +261 20 82 XXX XX.`,
    sources: [mockSources[3], mockSources[2]],
  },
  {
    keywords: ['examen', 'examens', 'note', 'résultat'],
    response: `Concernant les **examens et résultats** à l'ESPA :

**Calendrier des examens 2025-2026 :**
- Examens du **1er semestre** : 15 - 26 janvier 2026
- Examens du **2ème semestre** : 15 - 26 juin 2026
- Sessions de rattrapage : 2 semaines après la proclamation des résultats

**Pour valider votre année :**
- Moyenne générale ≥ **10/20**
- Aucune note éliminatoire (< 5/20) dans les matières fondamentales
- Présence obligatoire ≥ 75% des cours

**Consultation des résultats :**
Les résultats sont affichés au tableau d'affichage de la scolarité et sur le portail étudiant dans les **15 jours** suivant la fin des examens.`,
    sources: [mockSources[0], mockSources[1]],
  },
  {
    keywords: ['bourse', 'aide', 'financier', 'financement'],
    response: `Pour les **bourses et aides financières** disponibles à l'ESPA :

**Bourse nationale :**
- Attribution selon critères de mérite et de ressources
- Dossier à déposer avant le **30 septembre** de chaque année académique
- Montant : variable selon le niveau d'études

**Autres aides disponibles :**
- Aide sociale d'urgence (service social universitaire)
- Bourses d'excellence pour les premiers de promotion
- Partenariats avec des entreprises locales pour les étudiants en 3ème année

Renseignez-vous auprès du **Service des Affaires Sociales** au bâtiment B, bureau 205.`,
    sources: [mockSources[2]],
  },
  {
    keywords: ['calendrier', 'planning', 'date', 'emploi du temps'],
    response: `Voici le **calendrier académique 2025-2026** de l'ESPA :

| Période | Dates |
|---------|-------|
| Rentrée | 15 septembre 2025 |
| Vacances de Noël | 22 déc. 2025 - 5 jan. 2026 |
| Examens S1 | 15 - 26 janvier 2026 |
| Résultats S1 | 10 février 2026 |
| Vacances de Pâques | 30 mars - 6 avril 2026 |
| Examens S2 | 15 - 26 juin 2026 |
| Résultats finaux | 15 juillet 2026 |

Les **emplois du temps** détaillés par filière sont disponibles à la scolarité et affichés sur les panneaux d'information de chaque département.`,
    sources: [mockSources[1]],
  },
  {
    keywords: ['contact', 'adresse', 'téléphone', 'email', 'joindre'],
    response: `**Contacts utiles de l'ESPA Antsiranana :**

**Scolarité (inscriptions, documents)**
- Tél : +261 20 82 XXX XX
- Email : scolarite@espa.univ-antsiranana.mg
- Horaires : Lun-Ven, 8h-12h / 14h-17h

**Direction de l'École**
- Tél : +261 20 82 XXX XX
- Email : direction@espa.univ-antsiranana.mg

**Service Informatique**
- Email : informatique@espa.univ-antsiranana.mg

**Adresse postale :**
ESPA — École Supérieure Polytechnique d'Antsiranana
BP 0, Antsiranana 201, Madagascar`,
    sources: [mockSources[3]],
  },
]

// ── Mock Documents ────────────────────────────────────────────────────────────

export const mockDocuments: KnowledgeDocument[] = [
  {
    id: 'doc-1',
    title: 'Règlement des études ESPA 2025-2026',
    filename: 'reglement_etudes_2025-2026.pdf',
    category: 'reglements',
    status: 'indexed',
    chunkCount: 47,
    uploadedAt: '2025-09-01T08:00:00Z',
    updatedAt: '2025-09-01T08:45:00Z',
    size: 2457600,
    description: 'Règlement officiel des études pour l\'année académique 2025-2026',
    tags: ['règlement', 'études', 'officiel'],
  },
  {
    id: 'doc-2',
    title: 'Calendrier académique 2025-2026',
    filename: 'calendrier_academique_2025-2026.pdf',
    category: 'calendriers',
    status: 'indexed',
    chunkCount: 12,
    uploadedAt: '2025-09-01T09:00:00Z',
    updatedAt: '2025-09-01T09:10:00Z',
    size: 512000,
    description: 'Calendrier officiel des cours, examens et congés',
    tags: ['calendrier', 'examens', 'planning'],
  },
  {
    id: 'doc-3',
    title: 'Guide des procédures administratives',
    filename: 'guide_procedures_admin.pdf',
    category: 'procedures',
    status: 'indexed',
    chunkCount: 35,
    uploadedAt: '2025-09-02T10:00:00Z',
    updatedAt: '2025-09-02T10:30:00Z',
    size: 1843200,
    description: 'Guide complet des procédures administratives pour étudiants',
    tags: ['procédures', 'administratif', 'guide'],
  },
  {
    id: 'doc-4',
    title: 'FAQ Étudiants ESPA',
    filename: 'faq_etudiants.pdf',
    category: 'faq',
    status: 'indexed',
    chunkCount: 28,
    uploadedAt: '2025-09-03T11:00:00Z',
    updatedAt: '2025-09-10T14:00:00Z',
    size: 921600,
    description: 'Foire aux questions des étudiants de l\'ESPA',
    tags: ['FAQ', 'questions', 'étudiants'],
  },
  {
    id: 'doc-5',
    title: 'Guide d\'inscription 2025-2026',
    filename: 'guide_inscription_2025.pdf',
    category: 'procedures',
    status: 'indexed',
    chunkCount: 18,
    uploadedAt: '2025-07-15T08:00:00Z',
    updatedAt: '2025-07-15T08:20:00Z',
    size: 768000,
    description: 'Guide complet pour les nouvelles inscriptions et réinscriptions',
    tags: ['inscription', 'guide', 'procédures'],
  },
  {
    id: 'doc-6',
    title: 'Programmes des filières 2025-2026',
    filename: 'programmes_filieres_2025.pdf',
    category: 'guides',
    status: 'indexed',
    chunkCount: 92,
    uploadedAt: '2025-08-20T09:00:00Z',
    updatedAt: '2025-08-20T11:30:00Z',
    size: 5242880,
    description: 'Programmes détaillés de toutes les filières STIC, GC, GM, GE',
    tags: ['programmes', 'filières', 'cours'],
  },
  {
    id: 'doc-7',
    title: 'Charte de l\'étudiant ESPA',
    filename: 'charte_etudiant.pdf',
    category: 'reglements',
    status: 'indexed',
    chunkCount: 22,
    uploadedAt: '2025-09-05T10:00:00Z',
    updatedAt: '2025-09-05T10:25:00Z',
    size: 614400,
    description: 'Droits et obligations des étudiants de l\'ESPA',
    tags: ['charte', 'droits', 'obligations'],
  },
  {
    id: 'doc-8',
    title: 'Procédure de demande de bourse',
    filename: 'procedure_bourse_2025.docx',
    category: 'procedures',
    status: 'processing',
    chunkCount: 0,
    uploadedAt: '2025-11-10T14:00:00Z',
    updatedAt: '2025-11-10T14:00:00Z',
    size: 204800,
    description: 'Procédure officielle pour la demande de bourse nationale',
    tags: ['bourse', 'aide', 'financier'],
  },
]

// ── Mock Conversation Logs ────────────────────────────────────────────────────

export const mockLogs: ConversationLog[] = [
  {
    id: 'log-1',
    sessionId: 'sess-abc123',
    userQuestion: 'Quelles sont les dates d\'inscription pour 2025-2026 ?',
    botResponse: 'Les inscriptions sont ouvertes du 1er juillet au 31 août 2025...',
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
    userQuestion: 'Comment obtenir mon relevé de notes ?',
    botResponse: 'Pour obtenir votre relevé de notes, vous devez vous présenter à la scolarité...',
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
    userQuestion: 'Quelles sont les notes minimales pour valider l\'année ?',
    botResponse: 'Pour valider votre année, vous devez obtenir une moyenne générale de 10/20...',
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
    botResponse: 'Je n\'ai pas trouvé d\'information précise sur ce sujet dans ma base de connaissances...',
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
    botResponse: 'Je n\'ai pas d\'information spécifique sur la connexion wifi dans mes documents...',
    sources: [],
    confidence: 0.28,
    status: 'fallback',
    mode: 'text',
    timestamp: '2025-11-08T15:45:18Z',
    responseTime: 645,
  },
  {
    id: 'log-6',
    sessionId: 'sess-pqr678',
    userQuestion: 'Quand sont les vacances de Noël ?',
    botResponse: 'Les vacances de Noël sont fixées du 22 décembre 2025 au 5 janvier 2026...',
    sources: [mockSources[1]],
    confidence: 0.96,
    status: 'resolved',
    mode: 'voice',
    timestamp: '2025-11-08T16:05:44Z',
    responseTime: 1890,
    feedback: 'positive',
  },
  {
    id: 'log-7',
    sessionId: 'sess-stu901',
    userQuestion: 'Y a-t-il une cantine sur le campus ?',
    botResponse: 'Je n\'ai pas cette information dans ma base de connaissances actuellement...',
    sources: [],
    confidence: 0.21,
    status: 'fallback',
    mode: 'text',
    timestamp: '2025-11-08T16:30:11Z',
    responseTime: 523,
  },
  {
    id: 'log-8',
    sessionId: 'sess-vwx234',
    userQuestion: 'Quels documents faut-il pour l\'inscription en M1 ?',
    botResponse: 'Pour vous inscrire en M1, vous aurez besoin des documents suivants...',
    sources: [mockSources[2], mockSources[3]],
    confidence: 0.86,
    status: 'resolved',
    mode: 'text',
    timestamp: '2025-11-09T08:12:30Z',
    responseTime: 1456,
    feedback: 'positive',
  },
  {
    id: 'log-9',
    sessionId: 'sess-yza567',
    userQuestion: 'Quel est le numéro de la scolarité ?',
    botResponse: 'Le numéro de téléphone de la scolarité est le +261 20 82 XXX XX...',
    sources: [mockSources[3]],
    confidence: 0.89,
    status: 'resolved',
    mode: 'text',
    timestamp: '2025-11-09T08:34:52Z',
    responseTime: 743,
    feedback: 'positive',
  },
  {
    id: 'log-10',
    sessionId: 'sess-bcd890',
    userQuestion: 'Comment s\'appelle le directeur de l\'ESPA ?',
    botResponse: 'Je ne dispose pas de cette information dans ma base de connaissances...',
    sources: [],
    confidence: 0.18,
    status: 'fallback',
    mode: 'text',
    timestamp: '2025-11-09T09:05:17Z',
    responseTime: 612,
  },
]

// ── Mock Dashboard Stats ──────────────────────────────────────────────────────

export const mockDashboardStats: DashboardStats = {
  totalConversations: 1247,
  resolvedRate: 0.82,
  avgResponseTime: 1340,
  voiceUsageRate: 0.35,
  totalDocuments: 8,
  totalChunks: 254,
  mrr5Score: 0.78,
  activeSessionsToday: 23,
  dailyStats: [
    { date: '2025-11-03', conversations: 89, resolvedCount: 71, fallbackCount: 18, avgResponseTime: 1200, voiceUsage: 28 },
    { date: '2025-11-04', conversations: 124, resolvedCount: 102, fallbackCount: 22, avgResponseTime: 1350, voiceUsage: 41 },
    { date: '2025-11-05', conversations: 97, resolvedCount: 81, fallbackCount: 16, avgResponseTime: 1180, voiceUsage: 35 },
    { date: '2025-11-06', conversations: 143, resolvedCount: 118, fallbackCount: 25, avgResponseTime: 1420, voiceUsage: 52 },
    { date: '2025-11-07', conversations: 167, resolvedCount: 140, fallbackCount: 27, avgResponseTime: 1290, voiceUsage: 58 },
    { date: '2025-11-08', conversations: 203, resolvedCount: 168, fallbackCount: 35, avgResponseTime: 1380, voiceUsage: 71 },
    { date: '2025-11-09', conversations: 178, resolvedCount: 145, fallbackCount: 33, avgResponseTime: 1310, voiceUsage: 63 },
  ],
  categoryStats: [
    { category: 'procedures', queryCount: 412, percentage: 33 },
    { category: 'reglements', queryCount: 287, percentage: 23 },
    { category: 'calendriers', queryCount: 249, percentage: 20 },
    { category: 'faq', queryCount: 187, percentage: 15 },
    { category: 'guides', queryCount: 87, percentage: 7 },
    { category: 'autres', queryCount: 25, percentage: 2 },
  ],
  topQuestions: [
    { question: 'Quelles sont les dates d\'inscription ?', count: 87 },
    { question: 'Comment obtenir un relevé de notes ?', count: 74 },
    { question: 'Quand sont les examens ?', count: 68 },
    { question: 'Quels documents pour l\'inscription ?', count: 61 },
    { question: 'Quelle est la moyenne minimale de validation ?', count: 55 },
    { question: 'Quand sont les vacances ?', count: 49 },
    { question: 'Comment contacter la scolarité ?', count: 43 },
    { question: 'Y a-t-il des bourses disponibles ?', count: 38 },
  ],
}

// ── Mock Admin User ───────────────────────────────────────────────────────────

export const mockAdminUser: AdminUser = {
  id: 'admin-1',
  email: 'admin@espa.mg',
  name: 'Administrateur ESPA',
  role: 'super_admin',
  lastLogin: '2025-11-09T07:30:00Z',
  createdAt: '2025-01-15T00:00:00Z',
}

// ── Utility ───────────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function getMockResponse(query: string): { content: string; sources: Source[]; confidence: number } {
  const lowerQuery = query.toLowerCase()
  const match = mockResponses.find(r =>
    r.keywords.some(kw => lowerQuery.includes(kw))
  )

  if (match) {
    return {
      content: match.response,
      sources: match.sources,
      confidence: 0.75 + Math.random() * 0.2,
    }
  }

  return {
    content: `Je n'ai pas trouvé d'information précise concernant votre question dans ma base de connaissances institutionnelle.

Pour obtenir une réponse fiable, je vous recommande de :
- Contacter la **scolarité** au +261 20 82 XXX XX
- Vous rendre au **bureau des affaires estudiantines** (bâtiment A)
- Envoyer un email à **scolarite@espa.univ-antsiranana.mg**

Puis-je vous aider avec autre chose ?`,
    sources: [],
    confidence: 0.25,
  }
}
