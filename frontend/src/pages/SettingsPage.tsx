import { useState, useEffect } from 'react'
import { Save, Bot, FileSliders as Sliders, Bell, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import type { AppSettings } from '@/types'

interface SettingSection {
  id: string
  icon: React.ReactNode
  title: string
  desc: string
}

const SECTIONS: SettingSection[] = [
  { id: 'rag', icon: <Bot className="w-4 h-4" />, title: 'Moteur RAG', desc: 'Paramètres de récupération et génération' },
  { id: 'llm', icon: <Sliders className="w-4 h-4" />, title: 'Modèle LLM', desc: 'Configuration du modèle de langage' },
  { id: 'notifications', icon: <Bell className="w-4 h-4" />, title: 'Notifications', desc: 'Alertes et rapports automatiques' },
]

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('rag')
  const [settings, setSettings] = useState<AppSettings>({
    top_k: 5,
    min_score: 0.65,
    fallback_threshold: 0.40,
    chunk_size: 500,
    chunk_overlap: 50,
    llm_provider: 'openai',
    llm_model: 'gpt-4o-mini',
    max_tokens: 1000,
    temperature: 0.2,
    notify_fallback: true,
    notify_weekly_report: true,
  })

  // Fetch settings from backend
  const { data: backendSettings, isLoading: isLoadingSettings } = useSettings()
  const updateMutation = useUpdateSettings()

  // Sync backend settings to local state when they load
  useEffect(() => {
    if (backendSettings && !isLoadingSettings) {
      setSettings(backendSettings)
    }
  }, [backendSettings, isLoadingSettings])

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(settings)
      toast.success('Paramètres sauvegardés avec succès')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde des paramètres')
    }
  }

  // Show loading state while fetching settings from backend
  if (isLoadingSettings) {
    return (
      <div className="max-w-3xl space-y-5 animate-fade-in">
        <Card>
          <div className="flex items-center justify-center py-8">
            <Loader className="w-5 h-5 animate-spin text-primary-600" />
            <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
              Chargement des paramètres...
            </span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in">
      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeSection === s.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            {s.icon}
            {s.title}
          </button>
        ))}
      </div>

      {/* RAG Settings */}
      {activeSection === 'rag' && (
        <Card>
          <h2 className="font-semibold text-neutral-900 dark:text-white mb-1">Paramètres RAG</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
            Contrôlez la récupération des documents et les seuils de confiance.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Top-K (chunks récupérés)"
              type="number"
              min={1}
              max={20}
              value={settings.top_k}
              onChange={e => setSettings(p => ({ ...p, top_k: +e.target.value }))}
              hint="Nombre de chunks envoyés au LLM (recommandé : 3-7)"
            />
            <Input
              label="Score minimum (cosine)"
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={settings.min_score}
              onChange={e => setSettings(p => ({ ...p, min_score: +e.target.value }))}
              hint="Seuil de similarité minimale (0.65 recommandé)"
            />
            <Input
              label="Seuil fallback"
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={settings.fallback_threshold}
              onChange={e => setSettings(p => ({ ...p, fallback_threshold: +e.target.value }))}
              hint="En dessous : réponse hors-domaine (0.40 recommandé)"
            />
            <Input
              label="Taille des chunks (tokens)"
              type="number"
              min={100}
              max={2000}
              value={settings.chunk_size}
              onChange={e => setSettings(p => ({ ...p, chunk_size: +e.target.value }))}
              hint="Recommandé : 400-600 tokens"
            />
            <Input
              label="Overlap entre chunks (tokens)"
              type="number"
              min={0}
              max={200}
              value={settings.chunk_overlap}
              onChange={e => setSettings(p => ({ ...p, chunk_overlap: +e.target.value }))}
              hint="Recouvrement pour préserver le contexte (50 recommandé)"
            />
          </div>
        </Card>
      )}

      {/* Notifications */}
      {activeSection === 'notifications' && (
        <Card>
          <h2 className="font-semibold text-neutral-900 dark:text-white mb-1">Notifications</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
            Configurez les alertes automatiques.
          </p>
          <div className="space-y-4">
            {[
              { key: 'notify_fallback', label: 'Alerte questions hors-domaine', desc: 'Recevoir une notification quand le taux de fallback dépasse 20%' },
              { key: 'notify_weekly_report', label: 'Rapport hebdomadaire', desc: 'Résumé des statistiques chaque lundi matin' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings[key as keyof AppSettings] as boolean}
                  onChange={e => setSettings(p => ({ ...p, [key]: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          icon={updateMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
    </div>
  )
}
