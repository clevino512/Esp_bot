import { useState } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface TranscriptVerificationModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (fullName: string, studentIdentifier: string) => void
}

export function TranscriptVerificationModal({
  open,
  onClose,
  onSubmit,
}: TranscriptVerificationModalProps) {
  const [fullName, setFullName] = useState('')
  const [studentIdentifier, setStudentIdentifier] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!fullName.trim() || !studentIdentifier.trim()) {
      setError('Le nom complet et l’identifiant scolaire sont obligatoires.')
      return
    }
    setError('')
    onSubmit(fullName.trim(), studentIdentifier.trim())
    setFullName('')
    setStudentIdentifier('')
  }

  function handleClose() {
    setError('')
    setFullName('')
    setStudentIdentifier('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Vérification étudiant"
      description="Cette demande concerne des données personnelles et nécessite une vérification."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3 rounded-xl border border-primary-100 bg-primary-50 p-3.5 dark:border-primary-800/40 dark:bg-primary-900/20">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600 dark:text-primary-400" />
          <p className="text-xs leading-relaxed text-primary-800 dark:text-primary-300">
            L’identifiant unique doit avoir été fourni par la scolarité. Sans
            correspondance avec le registre de l’ESPA, aucun relevé ne sera
            communiqué.
          </p>
        </div>

        <Input
          label="Nom complet"
          placeholder="Ex. Jean RAKOTO"
          autoComplete="name"
          value={fullName}
          onChange={event => setFullName(event.target.value)}
          required
        />
        <Input
          label="Identifiant scolaire unique"
          placeholder="Ex. ESPA-2025-001"
          autoComplete="off"
          value={studentIdentifier}
          onChange={event => setStudentIdentifier(event.target.value)}
          leftIcon={<LockKeyhole className="h-4 w-4" />}
          required
        />

        {error && (
          <p className="text-xs text-error-600 dark:text-error-400">{error}</p>
        )}

        <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit">Vérifier et continuer</Button>
        </div>
      </form>
    </Modal>
  )
}