import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { getDocuments, uploadDocument, deleteDocument, reindexDocument } from '@/services/adminService'
import type { KnowledgeDocument, DocumentCategory } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: 'reglements', label: 'Règlements' },
  { value: 'calendriers', label: 'Calendriers' },
  { value: 'procedures', label: 'Procédures' },
  { value: 'faq', label: 'FAQ' },
  { value: 'guides', label: 'Guides' },
  { value: 'autres', label: 'Autres' },
]

const STATUS_COLORS: Record<KnowledgeDocument['status'], 'success' | 'warning' | 'error' | 'default'> = {
  indexed: 'success',
  processing: 'warning',
  error: 'error',
  pending: 'default',
}

const STATUS_LABELS: Record<KnowledgeDocument['status'], string> = {
  indexed: 'Indexé',
  processing: 'En cours',
  error: 'Erreur',
  pending: 'En attente',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentManager() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeDocument | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('procedures')
  const [uploadDesc, setUploadDesc] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments,
    refetchInterval: 5000,
  })

  const uploadMutation = useMutation({
    mutationFn: () => uploadDocument(uploadFile!, uploadCategory, uploadDesc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document uploadé, indexation en cours...')
      setUploadOpen(false)
      setUploadFile(null)
      setUploadDesc('')
    },
    onError: () => toast.error('Erreur lors de l\'upload'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document supprimé')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const reindexMutation = useMutation({
    mutationFn: (id: string) => reindexDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document réindexé')
    },
    onError: () => toast.error('Erreur lors de la réindexation'),
  })

  const filtered = documents.filter(doc => {
    const matchSearch = doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.filename.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'all' || doc.category === categoryFilter
    return matchSearch && matchCat
  })

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) setUploadFile(file)
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Rechercher un document..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="sm:max-w-xs"
        />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Toutes les catégories</option>
            {CATEGORY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1" />
        <Button onClick={() => setUploadOpen(true)} icon={<Upload className="w-4 h-4" />}>
          Ajouter un document
        </Button>
      </div>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-5 py-3">Document</th>
                <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-3 py-3 hidden sm:table-cell">Catégorie</th>
                <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-3 py-3 hidden md:table-cell">Statut</th>
                <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-3 py-3 hidden lg:table-cell">Chunks</th>
                <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-3 py-3 hidden lg:table-cell">Taille</th>
                <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-3 py-3 hidden xl:table-cell">Ajouté</th>
                <th className="text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-neutral-500 dark:text-neutral-400 text-sm">
                    Aucun document trouvé
                  </td>
                </tr>
              ) : filtered.map(doc => (
                <tr
                  key={doc.id}
                  className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate max-w-[200px]">{doc.title}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{doc.filename}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 hidden sm:table-cell">
                    <Badge variant="primary">
                      {CATEGORY_OPTIONS.find(o => o.value === doc.category)?.label ?? doc.category}
                    </Badge>
                  </td>
                  <td className="px-3 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      {doc.status === 'indexed' && <CheckCircle className="w-3.5 h-3.5 text-success-500" />}
                      {doc.status === 'processing' && <Loader2 className="w-3.5 h-3.5 text-warning-500 animate-spin" />}
                      {doc.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-error-500" />}
                      <Badge variant={STATUS_COLORS[doc.status]}>{STATUS_LABELS[doc.status]}</Badge>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 hidden lg:table-cell">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {doc.chunkCount > 0 ? doc.chunkCount : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 hidden lg:table-cell">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">{formatBytes(doc.size)}</span>
                  </td>
                  <td className="px-3 py-3.5 hidden xl:table-cell">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {formatDistanceToNow(parseISO(doc.uploadedAt), { addSuffix: true, locale: fr })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="relative flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setOpenMenu(openMenu === doc.id ? null : doc.id)}
                        className="w-7 h-7 p-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      {openMenu === doc.id && (
                        <div className="absolute right-0 top-8 z-10 w-44 bg-white dark:bg-neutral-800 rounded-xl shadow-elevated border border-neutral-200 dark:border-neutral-700 py-1 animate-slide-down">
                          <button
                            onClick={() => { reindexMutation.mutate(doc.id); setOpenMenu(null) }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Réindexer
                          </button>
                          <button
                            onClick={() => { setDeleteTarget(doc); setOpenMenu(null) }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {filtered.length} document{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {documents.reduce((s, d) => s + d.chunkCount, 0)} chunks au total
          </p>
        </div>
      </Card>

      {/* Upload Modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Ajouter un document" size="md">
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
              uploadFile
                ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/10'
                : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              className="hidden"
              onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
            />
            {uploadFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-primary-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{uploadFile.name}</p>
                  <p className="text-xs text-neutral-500">{formatBytes(uploadFile.size)}</p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Glissez-déposez ou cliquez pour choisir
                </p>
                <p className="text-xs text-neutral-400 mt-1">PDF, DOCX, TXT, Markdown — max 10 MB</p>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Catégorie</label>
            <select
              value={uploadCategory}
              onChange={e => setUploadCategory(e.target.value as DocumentCategory)}
              className="h-10 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Description (optionnel)</label>
            <textarea
              value={uploadDesc}
              onChange={e => setUploadDesc(e.target.value)}
              placeholder="Décrivez le contenu du document..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Annuler</Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!uploadFile}
              loading={uploadMutation.isPending}
              icon={<Upload className="w-4 h-4" />}
            >
              Uploader
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le document"
        size="sm"
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5">
          Êtes-vous sûr de vouloir supprimer <strong className="text-neutral-900 dark:text-white">"{deleteTarget?.title}"</strong> ? Cette action supprimera également tous ses chunks de la base vectorielle.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  )
}
