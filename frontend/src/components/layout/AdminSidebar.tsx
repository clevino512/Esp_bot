import { NavLink, Link } from 'react-router-dom'
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  MessageSquare,
  BarChart2,
  Settings,
  LogOut,
  X,
  ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
  { to: '/admin/documents', icon: FileText, label: 'Documents' },
  { to: '/admin/logs', icon: MessageSquare, label: 'Conversations' },
  { to: '/admin/stats', icon: BarChart2, label: 'Statistiques' },
  { to: '/admin/settings', icon: Settings, label: 'Paramètres' },
]

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const { user, logout } = useAuth()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed left-0 top-0 z-50 h-full w-64 bg-white dark:bg-neutral-900',
        'border-r border-neutral-200 dark:border-neutral-800 flex flex-col',
        'transition-transform duration-300',
        'md:translate-x-0 md:static md:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-neutral-200 dark:border-neutral-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-neutral-900 dark:text-white">UniBot</span>
              <span className="font-bold text-primary-600"> ESPA</span>
            </div>
          </Link>
          <Button variant="ghost" size="xs" onClick={onClose} className="md:hidden w-7 h-7 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Navigation</p>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start gap-2 text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20">
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </Button>
        </div>
      </aside>
    </>
  )
}
