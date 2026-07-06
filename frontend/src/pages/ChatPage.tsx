import { Link } from 'react-router-dom'
import { GraduationCap, Shield, BookOpen, Mic, Brain } from 'lucide-react'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { TestimonialWidget } from '@/components/chat/TestimonialWidget'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// Read the session id stored by useChat without duplicating the hook
const SESSION_KEY = 'unibot_session_id'

const FEATURES = [
  { icon: Brain, label: 'Réponses contextuelles', desc: 'Basées sur les documents officiels ESPA' },
  { icon: Mic, label: 'Interaction vocale', desc: 'Posez vos questions à voix haute' },
  { icon: BookOpen, label: 'Sources citées', desc: 'Références documentaires transparentes' },
]

export function ChatPage() {
  const sessionId = localStorage.getItem(SESSION_KEY) ?? undefined

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center h-16 px-4 max-w-screen-lg mx-auto gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-neutral-900 dark:text-white">UniBot</span>
              <span className="font-bold text-primary-600"> ESPA</span>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Administration</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-screen-lg mx-auto w-full px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar info */}
        <aside className="hidden lg:flex flex-col gap-5 w-72 flex-shrink-0">
          {/* ESPA info card */}
          <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-2xl p-5 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-lg leading-tight mb-1">ESPA Antsiranana</h2>
            <p className="text-primary-200 text-sm leading-relaxed">
              École Supérieure Polytechnique d'Antsiranana — Université d'Antsiranana
            </p>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs text-primary-200">50<sup>ème</sup> anniversaire 2025-2026</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <TestimonialWidget sessionId={sessionId} />

          {/* Disclaimer */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              <strong>Note :</strong> UniBot s'appuie sur les documents institutionnels disponibles. Pour toute question urgente ou officielle, contactez directement la scolarité.
            </p>
          </div>
        </aside>

        {/* Chat */}
        <div className="flex-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-card overflow-hidden flex flex-col" style={{ minHeight: '75vh' }}>
          <ChatWindow />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-4 px-4">
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-600">
          UniBot ESPA — PFE STIC 2025-2026 | Université d'Antsiranana, Madagascar
        </p>
      </footer>
    </div>
  )
}
