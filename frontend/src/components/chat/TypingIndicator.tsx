import { GraduationCap } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
        <GraduationCap className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
        <div className="flex items-center gap-1.5 h-5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 bg-neutral-400 rounded-full animate-typing"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
