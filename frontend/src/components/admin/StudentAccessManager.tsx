import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CircleAlert,
  IdCard,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  createStudentAccess,
  deleteStudentAccess,
  getStudentAccessList,
  setStudentAccessActive,
} from '@/services/adminService'
import type { StudentAccess } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'

export function StudentAccessManager() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StudentAccess | null>(null)
  const [fullName, setFullName] = useState('')
  const [studentIdentifier, setStudentIdentifier] = useState('')

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['student-access'],
    queryFn: getStudentAccessList,
  })

  const createMutation = useMutation({
    mutationFn: () => createStudentAccess(fullName.trim(), studentIdentifier.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['student-access'] })
      toast.success('Étudiant autorisé ajouté')
      setFullName('')
      setStudentIdentifier('')
      setFormOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Impossible d’ajouter cet étudiant')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setStudentAccessActive(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['student-access'] })
      toast.success('Statut de l’accès mis à jour')
    },
    onError: () => toast.error('Impossible de modifier le statut'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteStudentAccess(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['student-access'] })
      toast.success('Accès étudiant supprimé')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Impossible de supprimer cet accès'),
  })

  function submitForm(event: React.FormEvent) {
    event.preventDefault()
    if (!fullName.trim() || !studentIdentifier.trim()) return
    createMutation.mutate()
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Étudiants autorisés
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
            Seuls les étudiants enregistrés par la scolarité peuvent demander
            leur relevé de notes.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} icon={<Plus className="h-4 w-4" />}>
          Ajouter un étudiant
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-50 p-2.5 dark:bg-primary-900/20">
              <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{students.length}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Enregistrés</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-success-50 p-2.5 dark:bg-success-900/20">
              <ShieldCheck className="h-5 w-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {students.filter(student => student.isActive).length}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Accès actifs</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-neutral-100 p-2.5 dark:bg-neutral-800">
              <LockKeyhole className="h-5 w-5 text-neutral-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {students.filter(student => !student.isActive).length}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Accès désactivés</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
            Registre de la scolarité
          </p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            L’identifiant complet n’est jamais réaffiché après son enregistrement.
          </p>
        </div>
        {isLoading ? (
          <PageSpinner />
        ) : students.length === 0 ? (
          <div className="p-10 text-center">
            <IdCard className="mx-auto h-8 w-8 text-neutral-300 dark:text-neutral-600" />
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Aucun étudiant autorisé pour le moment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  <th className="px-5 py-3">Étudiant</th>
                  <th className="px-3 py-3">Identifiant</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Ajouté</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {students.map(student => (
                  <tr key={student.id}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-primary-50 p-2 dark:bg-primary-900/20">
                          <UserRound className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          {student.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-sm text-neutral-600 dark:text-neutral-400">
                      {student.maskedIdentifier}
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge variant={student.isActive ? 'success' : 'default'}>
                        {student.isActive ? 'Actif' : 'Désactivé'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {formatDistanceToNow(parseISO(student.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          loading={toggleMutation.isPending && toggleMutation.variables?.id === student.id}
                          onClick={() =>
                            toggleMutation.mutate({
                              id: student.id,
                              isActive: !student.isActive,
                            })
                          }
                        >
                          {student.isActive ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
                          onClick={() => setDeleteTarget(student)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Ajouter un étudiant autorisé"
        description="Saisissez exactement les informations transmises par la scolarité."
      >
        <form onSubmit={submitForm} className="space-y-4">
          <Input
            label="Nom complet"
            placeholder="Ex. Jean RAKOTO"
            value={fullName}
            onChange={event => setFullName(event.target.value)}
            required
          />
          <Input
            label="Identifiant scolaire unique"
            placeholder="Ex. ESPA-2025-001"
            value={studentIdentifier}
            onChange={event => setStudentIdentifier(event.target.value)}
            hint="L’identifiant sera protégé et affiché masqué dans le registre."
            required
          />
          <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer l’accès ?"
        description="L’étudiant ne pourra plus obtenir son relevé avec cet identifiant."
      >
        <div className="flex items-start gap-3 rounded-xl bg-error-50 p-3.5 dark:bg-error-900/20">
          <CircleAlert className="h-5 w-5 flex-shrink-0 text-error-600 dark:text-error-400" />
          <p className="text-sm text-error-700 dark:text-error-300">
            Cette action retire définitivement l’autorisation de{' '}
            <strong>{deleteTarget?.fullName}</strong>.
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Annuler
          </Button>
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