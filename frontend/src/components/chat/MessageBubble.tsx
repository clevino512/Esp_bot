import { useState } from 'react'
import { GraduationCap, User, Mic, ChevronDown, ChevronUp, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react'
import { clsx } from 'clsx'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Message } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const hasSources = (message.sources?.length ?? 0) > 0
  const isFallback = (message.confidence ?? 1) < 0.5

  return (
    <div className={clsx(
      'flex items-end gap-3 animate-slide-up',
      isUser && 'flex-row-reverse'
    )}>
      {/* Avatar */}
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isUser
          ? 'bg-neutral-200 dark:bg-neutral-700'
          : 'bg-primary-600'
      )}>
        {isUser
          ? <User className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          : <GraduationCap className="w-4 h-4 text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={clsx('max-w-[80%] flex flex-col gap-1.5', isUser && 'items-end')}>
        {/* Mode indicator */}
        {message.mode === 'voice' && (
          <span className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
            <Mic className="w-3 h-3" />
            {isUser ? 'Message vocal' : 'Réponse vocale'}
          </span>
        )}

        {/* Content */}
        <div className={clsx(
          'rounded-2xl px-4 py-3 shadow-card',
          isUser
            ? 'bg-primary-600 text-white rounded-br-sm'
            : clsx(
                'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-bl-sm',
                isFallback && 'border-warning-300 dark:border-warning-700/50 bg-warning-50/50 dark:bg-warning-900/10'
              )
        )}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className={clsx(
              'prose prose-sm max-w-none',
              'prose-headings:font-semibold prose-headings:text-neutral-900 dark:prose-headings:text-white',
              'prose-p:text-neutral-700 dark:prose-p:text-neutral-300 prose-p:leading-relaxed',
              'prose-strong:text-neutral-900 dark:prose-strong:text-white prose-strong:font-semibold',
              'prose-ul:text-neutral-700 dark:prose-ul:text-neutral-300',
              'prose-ol:text-neutral-700 dark:prose-ol:text-neutral-300',
              'prose-li:leading-relaxed',
              'prose-table:text-sm prose-td:text-neutral-700 dark:prose-td:text-neutral-300',
              'prose-th:text-neutral-800 dark:prose-th:text-neutral-200',
              '[&>:first-child]:mt-0 [&>:last-child]:mb-0'
            )}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Fallback warning */}
        {isAssistant && isFallback && (
          <div className="flex items-center gap-1.5 px-1">
            <Badge variant="warning">Hors domaine</Badge>
            <span className="text-xs text-neutral-400">Contactez la scolarité pour plus d'infos</span>
          </div>
        )}

        {/* Sources */}
        {isAssistant && hasSources && (
          <div className="w-full">
            <button
              onClick={() => setSourcesOpen(p => !p)}
              className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{message.sources!.length} source{message.sources!.length > 1 ? 's' : ''} citée{message.sources!.length > 1 ? 's' : ''}</span>
              {sourcesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {sourcesOpen && (
              <div className="mt-2 space-y-2 animate-slide-down">
                {message.sources!.map(source => (
                  <div
                    key={source.id}
                    className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 leading-tight">
                        {source.document}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {source.page && (
                          <Badge variant="default">p. {source.page}</Badge>
                        )}
                        <Badge variant="primary">
                          {Math.round(source.relevanceScore * 100)}%
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 italic leading-relaxed line-clamp-2">
                      "{source.excerpt}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamp + Feedback */}
        <div className={clsx('flex items-center gap-2 px-1', isUser && 'flex-row-reverse')}>
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
            {format(message.timestamp, 'HH:mm', { locale: fr })}
          </span>

          {isAssistant && !isFallback && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFeedback('positive')}
                className={clsx(
                  'p-0.5 rounded transition-colors',
                  feedback === 'positive'
                    ? 'text-success-500'
                    : 'text-neutral-300 dark:text-neutral-600 hover:text-success-500'
                )}
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => setFeedback('negative')}
                className={clsx(
                  'p-0.5 rounded transition-colors',
                  feedback === 'negative'
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
  )
}
