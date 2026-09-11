import { useState, useEffect } from 'react'
import {
  Save,
  Bot,
  FileSliders as Sliders,
  Bell,
  Loader,
  Cpu,
} from 'lucide-react'
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
  {
    id: 'rag',
    icon: <Bot className="w-4 h-4" />,
    title: 'Moteur RAG',
    desc: 'Paramètres de récupération et génération',
  },
  {
    id: 'llm',
    icon: <Sliders className="w-4 h-4" />,
    title: 'Modèle LLM',
    desc: 'Configuration du modèle de langage',
  },
  {
    id: 'notifications',
    icon: <Bell className="w-4 h-4" />,
    title: 'Notifications',
    desc: 'Alertes et rapports automatiques',
  },
]

/*
 * Modèles proposés selon le fournisseur.
 *
 * Tu peux ajouter d'autres modèles ici plus tard
 * sans modifier le reste du composant.
 */
const LLM_MODELS: Record<string, string[]> = {
  openai: [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4.1-mini',
    'gpt-4.1',
  ],

  openrouter: [
    'openai/gpt-4o-mini',
    'mistralai/mistral-7b-instruct',
    'mistralai/mistral-small',
    'meta-llama/llama-3.1-8b-instruct',
    'google/gemma-2-9b-it',
  ],

  ollama: [
    'mistral:7b',
    'llama3.1:8b',
    'gemma2:9b',
    'qwen2.5:7b',
  ],
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('rag')

  const [settings, setSettings] = useState<AppSettings>({
    top_k: 5,
    min_score: 0.65,
    fallback_threshold: 0.4,
    chunk_size: 500,
    chunk_overlap: 50,

    // LLM
    llm_provider: 'openai',
    llm_model: 'gpt-4o-mini',
    max_tokens: 1000,
    temperature: 0.2,

    // Notifications
    notify_fallback: true,
    notify_weekly_report: true,
  })

  /*
   * Récupération des paramètres depuis le backend
   */
  const {
    data: backendSettings,
    isLoading: isLoadingSettings,
  } = useSettings()

  const updateMutation = useUpdateSettings()

  /*
   * Synchroniser les paramètres backend
   * avec l'état local.
   */
  useEffect(() => {
    if (backendSettings && !isLoadingSettings) {
      setSettings(backendSettings)
    }
  }, [backendSettings, isLoadingSettings])

  /*
   * Changer le fournisseur LLM.
   *
   * Lorsqu'on change le fournisseur,
   * le premier modèle correspondant est sélectionné.
   */
  const handleProviderChange = (provider: string) => {
    const models = LLM_MODELS[provider] ?? []

    setSettings(previous => ({
      ...previous,
      llm_provider: provider,
      llm_model: models[0] ?? '',
    }))
  }

  /*
   * Sauvegarde des paramètres
   */
  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(settings)

      toast.success(
        'Paramètres sauvegardés avec succès'
      )
    } catch (error) {
      console.error(
        'Erreur lors de la sauvegarde :',
        error
      )

      toast.error(
        'Erreur lors de la sauvegarde des paramètres'
      )
    }
  }

  /*
   * État chargement
   */
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

  /*
   * Liste des modèles disponibles
   * pour le fournisseur sélectionné.
   */
  const availableModels =
    LLM_MODELS[settings.llm_provider] ?? []

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in">

      {/* =====================================================
          SECTION TABS
      ====================================================== */}

      <div className="flex gap-2 overflow-x-auto pb-1">

        {SECTIONS.map(section => (

          <button
            key={section.id}
            type="button"
            onClick={() =>
              setActiveSection(section.id)
            }
            className={`
              flex
              items-center
              gap-2

              px-4
              py-2.5

              rounded-xl

              text-sm
              font-medium

              whitespace-nowrap

              transition-all

              ${
                activeSection === section.id
                  ? `
                    bg-primary-600
                    text-white
                    shadow-sm
                  `
                  : `
                    bg-white
                    dark:bg-neutral-900

                    text-neutral-600
                    dark:text-neutral-400

                    border
                    border-neutral-200
                    dark:border-neutral-700

                    hover:bg-neutral-50
                    dark:hover:bg-neutral-800
                  `
              }
            `}
          >

            {section.icon}

            {section.title}

          </button>

        ))}

      </div>


      {/* =====================================================
          RAG SETTINGS
      ====================================================== */}

      {activeSection === 'rag' && (

        <Card>

          <div className="mb-5">

            <h2 className="font-semibold text-neutral-900 dark:text-white mb-1">
              Paramètres RAG
            </h2>

            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Contrôlez la récupération des documents,
              les seuils de similarité et la segmentation.
            </p>

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Input
              label="Top-K (chunks récupérés)"
              type="number"
              min={1}
              max={20}
              value={settings.top_k}
              onChange={event =>
                setSettings(previous => ({
                  ...previous,
                  top_k: +event.target.value,
                }))
              }
              hint="Nombre de chunks envoyés au LLM (recommandé : 3-7)"
            />


            <Input
              label="Score minimum (cosine)"
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={settings.min_score}
              onChange={event =>
                setSettings(previous => ({
                  ...previous,
                  min_score: +event.target.value,
                }))
              }
              hint="Seuil de similarité minimale (0.65 recommandé)"
            />


            <Input
              label="Seuil fallback"
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={settings.fallback_threshold}
              onChange={event =>
                setSettings(previous => ({
                  ...previous,
                  fallback_threshold:
                    +event.target.value,
                }))
              }
              hint="En dessous : réponse hors-domaine (0.40 recommandé)"
            />


            <Input
              label="Taille des chunks (tokens)"
              type="number"
              min={100}
              max={2000}
              value={settings.chunk_size}
              onChange={event =>
                setSettings(previous => ({
                  ...previous,
                  chunk_size: +event.target.value,
                }))
              }
              hint="Recommandé : 400-600 tokens"
            />


            <Input
              label="Overlap entre chunks (tokens)"
              type="number"
              min={0}
              max={200}
              value={settings.chunk_overlap}
              onChange={event =>
                setSettings(previous => ({
                  ...previous,
                  chunk_overlap:
                    +event.target.value,
                }))
              }
              hint="Recouvrement pour préserver le contexte (50 recommandé)"
            />

          </div>

        </Card>

      )}


      {/* =====================================================
          LLM SETTINGS
      ====================================================== */}

      {activeSection === 'llm' && (

        <div className="space-y-5">

          <Card>

            {/* Header */}

            <div className="flex items-start gap-3 mb-6">

              <div
                className="
                  w-10
                  h-10

                  rounded-xl

                  bg-primary-50
                  dark:bg-primary-900/20

                  flex
                  items-center
                  justify-center

                  flex-shrink-0
                "
              >

                <Cpu
                  className="
                    w-5 h-5

                    text-primary-600
                    dark:text-primary-400
                  "
                />

              </div>


              <div>

                <h2 className="font-semibold text-neutral-900 dark:text-white">
                  Configuration du modèle LLM
                </h2>

                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Configurez le fournisseur et le modèle
                  utilisé pour générer les réponses UniBot.
                </p>

              </div>

            </div>


            <div className="space-y-5">

              {/* Provider + Model */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Provider */}

                <div>

                  <label
                    htmlFor="llm-provider"
                    className="
                      block
                      text-sm
                      font-medium

                      text-neutral-700
                      dark:text-neutral-300

                      mb-1.5
                    "
                  >
                    Fournisseur LLM
                  </label>

                  <select
                    id="llm-provider"
                    value={settings.llm_provider}
                    onChange={event =>
                      handleProviderChange(
                        event.target.value
                      )
                    }
                    className="
                      w-full
                      h-10

                      px-3

                      rounded-xl

                      bg-white
                      dark:bg-neutral-900

                      border
                      border-neutral-300
                      dark:border-neutral-700

                      text-sm

                      text-neutral-800
                      dark:text-neutral-200

                      outline-none

                      focus:ring-2
                      focus:ring-primary-500/30

                      focus:border-primary-500

                      transition-all
                    "
                  >

                    <option value="openai">
                      OpenAI
                    </option>

                    <option value="openrouter">
                      OpenRouter
                    </option>

                    <option value="ollama">
                      Ollama — Local
                    </option>

                  </select>


                  <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Service utilisé pour accéder au modèle.
                  </p>

                </div>


                {/* Model */}

                <div>

                  <label
                    htmlFor="llm-model"
                    className="
                      block
                      text-sm
                      font-medium

                      text-neutral-700
                      dark:text-neutral-300

                      mb-1.5
                    "
                  >
                    Modèle
                  </label>


                  <select
                    id="llm-model"
                    value={settings.llm_model}
                    onChange={event =>
                      setSettings(previous => ({
                        ...previous,
                        llm_model:
                          event.target.value,
                      }))
                    }
                    className="
                      w-full
                      h-10

                      px-3

                      rounded-xl

                      bg-white
                      dark:bg-neutral-900

                      border
                      border-neutral-300
                      dark:border-neutral-700

                      text-sm

                      text-neutral-800
                      dark:text-neutral-200

                      outline-none

                      focus:ring-2
                      focus:ring-primary-500/30

                      focus:border-primary-500

                      transition-all
                    "
                  >

                    {availableModels.map(model => (

                      <option
                        key={model}
                        value={model}
                      >
                        {model}
                      </option>

                    ))}

                  </select>


                  <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Modèle utilisé pour générer les réponses.
                  </p>

                </div>

              </div>


              {/* Divider */}

              <div className="border-t border-neutral-200 dark:border-neutral-800" />


              {/* Generation parameters */}

              <div>

                <div className="flex items-center gap-2 mb-4">

                  <Sliders className="w-4 h-4 text-neutral-500" />

                  <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    Paramètres de génération
                  </h3>

                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Max tokens */}

                  <Input
                    label="Nombre maximum de tokens"
                    type="number"
                    min={100}
                    max={8000}
                    step={100}
                    value={settings.max_tokens}
                    onChange={event =>
                      setSettings(previous => ({
                        ...previous,
                        max_tokens:
                          +event.target.value,
                      }))
                    }
                    hint="Longueur maximale de la réponse générée"
                  />


                  {/* Temperature */}

                  <Input
                    label="Température"
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={settings.temperature}
                    onChange={event =>
                      setSettings(previous => ({
                        ...previous,
                        temperature:
                          +event.target.value,
                      }))
                    }
                    hint="0.2 recommandé pour des réponses factuelles"
                  />

                </div>

              </div>

            </div>

          </Card>

        </div>

      )}


      {/* =====================================================
          NOTIFICATIONS
      ====================================================== */}

      {activeSection === 'notifications' && (

        <Card>

          <h2 className="font-semibold text-neutral-900 dark:text-white mb-1">
            Notifications
          </h2>

          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
            Configurez les alertes automatiques.
          </p>


          <div className="space-y-4">

            {[
              {
                key: 'notify_fallback',
                label:
                  'Alerte questions hors-domaine',
                desc:
                  'Recevoir une notification quand le taux de fallback dépasse 20%',
              },

              {
                key: 'notify_weekly_report',
                label:
                  'Rapport hebdomadaire',
                desc:
                  'Résumé des statistiques chaque lundi matin',
              },
            ].map(
              ({
                key,
                label,
                desc,
              }) => (

                <label
                  key={key}
                  className="
                    flex
                    items-start
                    gap-3

                    cursor-pointer

                    p-4

                    rounded-xl

                    border
                    border-neutral-200
                    dark:border-neutral-700

                    hover:bg-neutral-50
                    dark:hover:bg-neutral-800/50

                    transition-colors
                  "
                >

                  <input
                    type="checkbox"
                    checked={
                      settings[
                        key as keyof AppSettings
                      ] as boolean
                    }
                    onChange={event =>
                      setSettings(previous => ({
                        ...previous,
                        [key]:
                          event.target.checked,
                      }))
                    }
                    className="
                      mt-0.5
                      w-4
                      h-4

                      rounded

                      text-primary-600

                      focus:ring-primary-500
                    "
                  />


                  <div>

                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {label}
                    </p>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {desc}
                    </p>

                  </div>

                </label>

              )
            )}

          </div>

        </Card>

      )}


      {/* =====================================================
          SAVE BUTTON
      ====================================================== */}

      <div
        className="
          flex
          justify-end
          gap-3

          sticky
          bottom-0

          py-3

          bg-neutral-50/95
          dark:bg-neutral-950/95

          backdrop-blur-md
        "
      >

        <Button
          onClick={handleSave}
          icon={
            updateMutation.isPending
              ? (
                <Loader className="w-4 h-4 animate-spin" />
              )
              : (
                <Save className="w-4 h-4" />
              )
          }
          disabled={
            updateMutation.isPending
          }
        >

          {updateMutation.isPending
            ? 'Sauvegarde...'
            : 'Sauvegarder les paramètres'}

        </Button>

      </div>

    </div>
  )
}