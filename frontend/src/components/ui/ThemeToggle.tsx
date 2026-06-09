import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { Button } from './Button'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      className="w-9 h-9 p-0"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </Button>
  )
}
