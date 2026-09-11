import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { DocumentManager } from '@/components/admin/DocumentManager'
import { LogsViewer } from '@/components/admin/LogsViewer'
import { StatsPanel } from '@/components/admin/StatsPanel'
import { SUSPanel } from '@/components/admin/SUSPanel'
import { TestimonialsPanel } from '@/components/admin/TestimonialsPanel'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { SettingsPage } from './SettingsPage'
import { StudentAccessManager } from '@/components/admin/StudentAccessManager'

const PAGE_TITLES: Record<string, string> = {
  '': 'Tableau de bord',
  'documents': 'Gestion des documents',
  'students': 'Étudiants autorisés',
  'logs': 'Conversations',
  'stats': 'Statistiques',
  'sus': 'Évaluation SUS',
  'testimonials': 'Témoignages utilisateurs',
  'settings': 'Paramètres',
}

function usePageTitle() {
  const parts = window.location.pathname.split('/admin/')
  const sub = parts[1] ?? ''
  return PAGE_TITLES[sub] ?? 'Administration'
}

export function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const title = usePageTitle()

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-5 gap-3 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-9 h-9 p-0"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-base font-semibold text-neutral-900 dark:text-white flex-1">{title}</h1>
          <ThemeToggle />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="documents" element={<DocumentManager />} />
            {/* <Route path="students" element={<StudentAccessManager />} /> */}
            <Route path="logs" element={<LogsViewer />} />
            <Route path="stats" element={<StatsPanel />} />
            <Route path="sus" element={<SUSPanel />} />
            <Route path="testimonials" element={<TestimonialsPanel />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
