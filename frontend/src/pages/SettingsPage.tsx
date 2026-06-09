import { useState } from 'react'
import { Save, Bot, FileSliders as Sliders, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

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
  const [settings, setSettings] = useState({
    topK: 5,
    minScore: 0.65,
    fallbackThreshold: 0.40,
    chunkSize: 500,
    chunkOverlap: 50,
    llmProvider: 'openai',
    llmModel: 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.2,
    notifyFallback: true,
    notifyWeeklyReport: true,
  })

  const handleSave = () => {
    toast.success('Paramètres sauvegardés (simulation)')
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
              value={settings.topK}
              onChange={e => setSettings(p => ({ ...p, topK: +e.target.value }))}
              hint="Nombre de chunks envoyés au LLM (recommandé : 3-7)"
            />
            <Input
              label="Score minimum (cosine)"
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={settings.minScore}
              onChange={e => setSettings(p => ({ ...p, minScore: +e.target.value }))}
              hint="Seuil de similarité minimale (0.65 recommandé)"
            />
            <Input
              label="Seuil fallback"
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={settings.fallbackThreshold}
              onChange={e => setSettings(p => ({ ...p, fallbackThreshold: +e.target.value }))}
              hint="En dessous : réponse hors-domaine (0.40 recommandé)"
            />
            <Input
              label="Taille des chunks (tokens)"
              type="number"
              min={100}
              max={2000}
              value={settings.chunkSize}
              onChange={e => setSettings(p => ({ ...p, chunkSize: +e.target.value }))}
              hint="Recommandé : 400-600 tokens"
            />
            <Input
              label="Overlap entre chunks (tokens)"
              type="number"
              min={0}
              max={200}
              value={settings.chunkOverlap}
              onChange={e => setSettings(p => ({ ...p, chunkOverlap: +e.target.value }))}
              hint="Recouvrement pour préserver le contexte (50 recommandé)"
            />
          </div>
        </Card>
      )}

      {/* LLM Settings */}
      {activeSection === 'llm' && (
        <Card>
          <h2 className="font-semibold text-neutral-900 dark:text-white mb-1">Configuration LLM</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
            Choisissez le fournisseur et paramétrez le modèle de langage.
          </p>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Fournisseur LLM</label>
              <select
                value={settings.llmProvider}
                onChange={e => setSettings(p => ({ ...p, llmProvider: e.target.value }))}
                className="h-10 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="openai">OpenAI (en ligne)</option>
                <option value="ollama">Ollama — Mistral 7B (hors-ligne)</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Modèle"
                value={settings.llmModel}
                onChange={e => setSettings(p => ({ ...p, llmModel: e.target.value }))}
                hint="Ex: gpt-4o-mini, gpt-4o, mistral:7b"
              />
              <Input
                label="Max tokens"
                type="number"
                min={100}
                max={4000}
                value={settings.maxTokens}
                onChange={e => setSettings(p => ({ ...p, maxTokens: +e.target.value }))}
                hint="Longueur maximale de la réponse"
              />
              <Input
                label="Température"
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={settings.temperature}
                onChange={e => setSettings(p => ({ ...p, temperature: +e.target.value }))}
                hint="0.0 = déterministe, 1.0 = créatif (0.2 recommandé)"
              />
            </div>
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
              { key: 'notifyFallback', label: 'Alerte questions hors-domaine', desc: 'Recevoir une notification quand le taux de fallback dépasse 20%' },
              { key: 'notifyWeeklyReport', label: 'Rapport hebdomadaire', desc: 'Résumé des statistiques chaque lundi matin' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings[key as keyof typeof settings] as boolean}
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

      <div className="flex justify-end">
        <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>
          Sauvegarder les paramètres
        </Button>
      </div>
    </div>
  )
}
