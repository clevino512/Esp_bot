import { useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { InputBar } from './InputBar'
import { Button } from '@/components/ui/Button'
import { useChat } from '@/hooks/useChat'
import type { Message } from '@/types'

const SUGGESTED_QUESTIONS = [
  "Quelles sont les dates d'inscription ?",
  "Comment obtenir mon relevé de notes ?",
  "Quand sont les examens du S1 ?",
  "Y a-t-il des bourses disponibles ?",
]

export function ChatWindow() {
  const {
    messages,
    isLoading,
    sendTextMessage,
    sendVoiceMessage,
    handleFeedback,
    clearMessages,
  } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasOnlyWelcome = messages.length === 1

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse-soft" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            UniBot est en ligne
          </span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={clearMessages}
          title="Effacer la conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Effacer</span>
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {messages.map((msg: Message) =>
          msg.isStreaming ? (
            <TypingIndicator key={msg.id} />
          ) : (
            <MessageBubble
              key={msg.id}
              message={msg}
              onFeedback={msg.role === 'assistant' ? handleFeedback : undefined}
            />
          )
        )}

        {/* Suggested questions — shown only after welcome */}
        {hasOnlyWelcome && !isLoading && (
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

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <InputBar
        onSendText={sendTextMessage}
        onSendVoice={sendVoiceMessage}
        disabled={isLoading}
      />
    </div>
  )
}
