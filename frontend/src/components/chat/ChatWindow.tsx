import { useEffect, useRef, useState } from 'react'
import { MessageSquarePlus, Star, History, RotateCcw } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { InputBar } from './InputBar'
import { SUSModal } from './SUSModal'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useChat } from '@/hooks/useChat'
import type { Message } from '@/types'
import { TranscriptVerificationModal } from './TranscriptVerificationModal'

const SUGGESTED_QUESTIONS = [
  "Quelles sont les dates d'inscription ?",
  "Comment obtenir mon relevé de notes ?",
  "Quand sont les examens du S1 ?",
  "Y a-t-il des bourses disponibles ?",
]

const SUS_SUBMITTED_KEY = 'unibot_sus_submitted'

function formatSessionDate(date: Date): string {
  if (isToday(date)) return `aujourd'hui à ${format(date, 'HH:mm', { locale: fr })}`
  if (isYesterday(date)) return `hier à ${format(date, 'HH:mm', { locale: fr })}`
  return format(date, "EEEE d MMMM 'à' HH:mm", { locale: fr })
}

function isTranscriptRequest(message: string): boolean {
  const normalized = message.toLocaleLowerCase()
  return [
    'relevé de notes',
    'releve de notes',
    'relevé des notes',
    'releve des notes',
    'bulletin de notes',
    'mes notes',
    'mes résultats',
    'mes resultats',
    'notes personnelles',
    'notes du semestre',
  ].some(term => normalized.includes(term))
}

export function ChatWindow() {
  const {
    messages,
    isLoading,
    historyRestored,
    restoredMessageCount,
    restoredFromDate,
    sessionId,
    sendTextMessage,
    sendVoiceMessage,
    handleFeedback,
    clearMessages,
  } = useChat()

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const hasScrolledOnMountRef = useRef(false)
  const hasOnlyWelcome = messages.length === 1
  const hasEnoughMessages = messages.length >= 5
  const susAlreadySubmitted = localStorage.getItem(SUS_SUBMITTED_KEY) === 'true'
  const [susOpen, setSusOpen] = useState(false)
  const [newConvOpen, setNewConvOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [pendingTranscriptMessage, setPendingTranscriptMessage] = useState<{
    content: string
    mode: 'text' | 'voice'
  } | null>(null)

  const showRestoredBanner =
    historyRestored && restoredMessageCount > 0 && !bannerDismissed

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    if (!hasScrolledOnMountRef.current) {
      hasScrolledOnMountRef.current = true
      return
    }

    if (messages.length === 0) return

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120
    if (isNearBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  function handleNewConversation() {
    clearMessages()
    setNewConvOpen(false)
    setBannerDismissed(false)
  }

  function handleSendText(content: string) {
    if (isTranscriptRequest(content)) {
      setPendingTranscriptMessage({ content, mode: 'text' })
      return
    }
    void sendTextMessage(content)
  }

  function handleSendVoice(content: string) {
    if (isTranscriptRequest(content)) {
      setPendingTranscriptMessage({ content, mode: 'voice' })
      return
    }
    void sendVoiceMessage(content)
  }

  function submitTranscriptVerification(
    fullName: string,
    studentIdentifier: string
  ) {
    const pending = pendingTranscriptMessage
    setPendingTranscriptMessage(null)
    if (!pending) return

    const verification = { fullName, studentIdentifier }
    if (pending.mode === 'voice') {
      void sendVoiceMessage(pending.content, verification)
    } else {
      void sendTextMessage(pending.content, verification)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse-soft flex-shrink-0" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
            UniBot est en ligne
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasEnoughMessages && !susAlreadySubmitted && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setSusOpen(true)}
              title="Évaluer UniBot"
              className="gap-1.5"
            >
              <Star className="w-5 h5 text-amber-500" />
            </Button>
          )}
          <Button
            variant="outline"
            size="xs"
            onClick={() => setNewConvOpen(true)}
            title="Nouvelle conversation"
            className="gap-1.5"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* History restored banner */}
      {showRestoredBanner && (
        <div className="flex items-center gap-3 px-5 py-2.5 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800/30 animate-fade-in">
          <History className="w-4 h-4 text-primary-500 flex-shrink-0" />
          <p className="flex-1 text-xs text-primary-700 dark:text-primary-400">
            <span className="font-medium">Conversation restaurée</span>
            {restoredFromDate && (
              <span className="font-normal">
                {' '}— commencée {formatSessionDate(restoredFromDate)}
              </span>
            )}
            <span className="text-primary-500 dark:text-primary-500">
              {' '}({restoredMessageCount} message{restoredMessageCount > 1 ? 's' : ''})
            </span>
          </p>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-xs text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5 scroll-smooth"
      >
        {messages.map((msg: Message, index: number) => {
          const isFirstRestored = index === 1 && restoredMessageCount > 0 && historyRestored

          return (
            <div key={msg.id}>
              {/* Date separator before the first restored message */}
              {isFirstRestored && restoredFromDate && (
                <DateSeparator date={restoredFromDate} />
              )}

              {msg.isStreaming ? (
                <TypingIndicator />
              ) : (
                <MessageBubble
                  message={msg}
                  onFeedback={msg.role === 'assistant' ? handleFeedback : undefined}
                />
              )}
            </div>
          )
        })}

        {/* "Today" separator after restored messages */}
        {restoredMessageCount > 0 && historyRestored && messages.length > restoredMessageCount + 1 && (
          <DateSeparator date={new Date()} label="Aujourd'hui" />
        )}

        {/* Suggested questions */}
        {hasOnlyWelcome && !isLoading && historyRestored && (
          <div className="animate-fade-in">
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-3 text-center">
              Questions fréquentes
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendTextMessage(q)}
                  className="px-3 py-1.5 text-sm bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 text-primary-700 dark:text-primary-400 rounded-xl border border-primary-200 dark:border-primary-800 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SUS prompt */}
        {hasEnoughMessages && !susAlreadySubmitted && !isLoading && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
              <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400 flex-1">
                Votre avis compte ! Aidez-nous à améliorer UniBot en répondant à 10 questions rapides.
              </p>
              <button
                onClick={() => setSusOpen(true)}
                className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline flex-shrink-0"
              >
                Évaluer →
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        <InputBar
          onSendText={handleSendText}
          onSendVoice={handleSendVoice}
          disabled={isLoading}
        />
      </div>

      {/* SUS Modal */}
      <SUSModal open={susOpen} onClose={() => setSusOpen(false)} sessionId={sessionId} />

      {/* New conversation confirmation */}
      <Modal
        open={newConvOpen}
        onClose={() => setNewConvOpen(false)}
        title="Nouvelle conversation"
        size="sm"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-14 h-14 rounded-2xl bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center">
            <RotateCcw className="w-7 h-7 text-warning-500" />
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Démarrer une nouvelle conversation effacera l'historique actuel de votre écran.
              {messages.length > 1 && (
                <span className="block mt-1 text-xs text-neutral-400">
                  ({messages.length - 1} message{messages.length > 2 ? 's' : ''} dans la conversation courante)
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button variant="outline" onClick={() => setNewConvOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleNewConversation}
            icon={<MessageSquarePlus className="w-4 h-4" />}
          >
            Nouvelle conversation
          </Button>
        </div>
      </Modal>
      <TranscriptVerificationModal
        open={pendingTranscriptMessage !== null}
        onClose={() => setPendingTranscriptMessage(null)}
        onSubmit={submitTranscriptVerification}
      />
    </div>
  )
}

function DateSeparator({ date, label }: { date: Date; label?: string }) {
  const text =
    label ??
    (isToday(date)
      ? "Aujourd'hui"
      : isYesterday(date)
      ? 'Hier'
      : format(date, 'EEEE d MMMM yyyy', { locale: fr }))

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium px-2 flex-shrink-0">
        {text}
      </span>
      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
    </div>
  )
}
