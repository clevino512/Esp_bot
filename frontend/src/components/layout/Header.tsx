import { Link } from 'react-router-dom'
import { GraduationCap, Shield, Menu } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/Button'

interface HeaderProps {
  onMenuToggle?: () => void
  showMenu?: boolean
}

export function Header({ onMenuToggle, showMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center h-full px-4 gap-3 max-w-screen-xl mx-auto">
        {showMenu && onMenuToggle && (
          <Button variant="ghost" size="sm" onClick={onMenuToggle} className="w-9 h-9 p-0 md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        )}

        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-base font-bold text-neutral-900 dark:text-white">UniBot</span>
            <span className="text-base font-bold text-primary-600"> ESPA</span>
          </div>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
