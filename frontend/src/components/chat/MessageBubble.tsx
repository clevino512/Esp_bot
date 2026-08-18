import { useState } from 'react'
import {
  GraduationCap,
  User,
  Mic,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lock,
  FileText,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'
import { clsx } from 'clsx'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import type { Message, Source } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { SourceDetailModal } from './SourceDetailModal'
import { isSourceAllowed } from '@/services/documentPermissionService'

interface MessageBubbleProps {
  message: Message
  onFeedback?: (
    messageId: string,
    feedback: 'helpful' | 'not_helpful'
  ) => void
}

function SourceCard({
  source,
  onOpen,
}: {
  source: Source
  onOpen: (source: Source) => void
}) {
  const allowed = isSourceAllowed(source)

  const title =
    source.title ||
    source.document ||
    'Document source'

  const relevanceScore = source.relevanceScore ?? 0
  const pct = Math.round(relevanceScore * 100)

  const text =
    source.content ||
    source.excerpt ||
    ''

  const barColor =
    pct >= 80
      ? 'bg-success-500'
      : pct >= 60
        ? 'bg-primary-500'
        : 'bg-warning-500'

  return (
    <div
      onClick={() => {
        if (allowed) {
          onOpen(source)
        }
      }}
      className={clsx(
        'group relative rounded-xl p-3 border transition-all',
        allowed
          ? 'bg-white dark:bg-neutral-800/80 border-primary-200 dark:border-primary-800/40 cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-sm'
          : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 cursor-default'
      )}
    >
      <div className="flex items-start gap-2.5">

        {/* Icon */}
        <div
          className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
            allowed
              ? 'bg-primary-50 dark:bg-primary-900/30'
              : 'bg-neutral-100 dark:bg-neutral-700'
          )}
        >
          {allowed ? (
            <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          ) : (
            <Lock className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">

          {/* Title */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate leading-tight">
              {title}
            </p>

            <div className="flex items-center gap-1 flex-shrink-0">
              {source.page && (
                <Badge variant="default">
                  p.{source.page}
                </Badge>
              )}

              {allowed && (
                <ExternalLink className="w-3 h-3 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </div>


          {/* Content */}
          {allowed ? (
            text ? (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2 italic">
                « {text} »
              </p>
            ) : null
          ) : (
            <p className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              Contenu non disponible — document restreint
            </p>
          )}

        </div>
      </div>
    </div>
  )
}

export function MessageBubble({
  message,
  onFeedback,
}: MessageBubbleProps) {

  const [sourcesOpen, setSourcesOpen] = useState(false)

  const [selectedSource, setSelectedSource] =
    useState<Source | null>(null)

  const [localFeedback, setLocalFeedback] =
    useState<'helpful' | 'not_helpful' | null>(
      message.feedback === 'helpful'
        ? 'helpful'
        : message.feedback === 'not_helpful'
          ? 'not_helpful'
          : null
    )

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  const hasSources =
    (message.sources?.length ?? 0) > 0

  const isFallback =
    isAssistant &&
    (message.confidence ?? 1) < 0.5

  function handleFeedbackClick(
    feedback: 'helpful' | 'not_helpful'
  ) {
    if (localFeedback === feedback) {
      return
    }

    setLocalFeedback(feedback)

    onFeedback?.(
      message.id,
      feedback
    )
  }

  return (
    <>
      <div
        className={clsx(
          'flex items-end gap-3 animate-slide-up',
          isUser && 'flex-row-reverse'
        )}
      >

        {/* Avatar */}
        <div
          className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isUser
              ? 'bg-neutral-200 dark:bg-neutral-700'
              : 'bg-primary-600'
          )}
        >
          {isUser ? (
            <User className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          ) : (
            <GraduationCap className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Bubble */}
        <div
          className={clsx(
            'max-w-[80%] flex flex-col gap-1.5',
            isUser && 'items-end'
          )}
        >

          {/* Voice indicator */}
          {message.mode === 'voice' && (
            <span className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
              <Mic className="w-3 h-3" />

              {isUser
                ? 'Message vocal'
                : 'Réponse vocale'}
            </span>
          )}

          {/* Message */}
          <div
            className={clsx(
              'rounded-2xl px-4 py-3 shadow-card',

              isUser
                ? 'bg-primary-600 text-white rounded-br-sm'
                : clsx(
                    'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-bl-sm',

                    isFallback &&
                      'border-warning-300 dark:border-warning-700/50 bg-warning-50/50 dark:bg-warning-900/10'
                  )
            )}
          >
            {isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            ) : (
              <div
                className={clsx(
                  'prose prose-sm max-w-none',

                  'prose-headings:font-semibold',
                  'prose-headings:text-neutral-900',
                  'dark:prose-headings:text-white',

                  'prose-p:text-neutral-700',
                  'dark:prose-p:text-neutral-300',
                  'prose-p:leading-relaxed',

                  'prose-strong:text-neutral-900',
                  'dark:prose-strong:text-white',
                  'prose-strong:font-semibold',

                  'prose-ul:text-neutral-700',
                  'dark:prose-ul:text-neutral-300',

                  'prose-ol:text-neutral-700',
                  'dark:prose-ol:text-neutral-300',

                  'prose-li:leading-relaxed',

                  'prose-table:text-sm',

                  'prose-td:text-neutral-700',
                  'dark:prose-td:text-neutral-300',

                  'prose-th:text-neutral-800',
                  'dark:prose-th:text-neutral-200',

                  '[&>:first-child]:mt-0',
                  '[&>:last-child]:mb-0'
                )}
              >
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* ======================================= */}
          {/* FALLBACK */}
          {/* ======================================= */}

          {isFallback && (
            <div className="flex items-center gap-1.5 px-1">

              <span className="text-xs text-neutral-400">
                Contactez la scolarité pour plus d'informations.
              </span>

            </div>
          )}

          {/* ======================================= */}
          {/* SOURCES */}
          {/* ======================================= */}

          {isAssistant && hasSources && (
            <div className="w-full">

              {/* Toggle */}
              <button
                type="button"
                onClick={() =>
                  setSourcesOpen(previous => !previous)
                }
                className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />

                <span>
                  {message.sources!.length}{' '}
                  source
                  {message.sources!.length > 1
                    ? 's'
                    : ''}{' '}
                  citée
                  {message.sources!.length > 1
                    ? 's'
                    : ''}
                </span>

                {sourcesOpen ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>

              {/* Source cards */}
              {sourcesOpen && (
                <div className="mt-2.5 space-y-2 animate-slide-down">

                  {message.sources!.map(
                    source => (
                      <SourceCard
                        key={source.id}
                        source={source}
                        onOpen={setSelectedSource}
                      />
                    )
                  )}

                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1 px-0.5">
                    <BookOpen className="w-2.5 h-2.5" />
                    Sources issues des documents officiels ESPA
                  </p>

                </div>
              )}

            </div>
          )}

          {/* ======================================= */}
          {/* TIMESTAMP + FEEDBACK */}
          {/* ======================================= */}

          <div
            className={clsx(
              'flex items-center gap-2 px-1',
              isUser && 'flex-row-reverse'
            )}
          >
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
              {format(
                new Date(message.timestamp),
                'HH:mm',
                {
                  locale: fr,
                }
              )}
            </span>

            {isAssistant &&
              !isFallback &&
              onFeedback && (
                <div className="flex items-center gap-1">

                  {/* Helpful */}
                  <button
                    type="button"
                    onClick={() =>
                      handleFeedbackClick(
                        'helpful'
                      )
                    }
                    title="Réponse utile"
                    className={clsx(
                      'p-0.5 rounded transition-colors',

                      localFeedback ===
                      'helpful'
                        ? 'text-success-500'
                        : 'text-neutral-300 dark:text-neutral-600 hover:text-success-500'
                    )}
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>

                  {/* Not helpful */}
                  <button
                    type="button"
                    onClick={() =>
                      handleFeedbackClick(
                        'not_helpful'
                      )
                    }
                    title="Réponse non utile"
                    className={clsx(
                      'p-0.5 rounded transition-colors',

                      localFeedback ===
                      'not_helpful'
                        ? 'text-error-500'
                        : 'text-neutral-300 dark:text-neutral-600 hover:text-error-500'
                    )}
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>

                </div>
              )}
          </div>

        </div>
      </div>

      {/* ======================================= */}
      {/* SOURCE DETAIL MODAL */}
      {/* ======================================= */}

      <SourceDetailModal
        source={selectedSource}
        onClose={() =>
          setSelectedSource(null)
        }
      />
    </>
  )
}