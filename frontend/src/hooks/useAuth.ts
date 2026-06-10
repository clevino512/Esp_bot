import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { login as loginService, logout as logoutService } from '@/services/adminService'

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { user, tokens } = await loginService(email, password)
      setAuth(user, tokens)
      toast.success(`Bienvenue, ${user.name} !`)
      navigate('/admin')
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      const message = error.response?.data?.detail || (err instanceof Error ? err.message : 'Erreur de connexion')
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [setAuth, setLoading, navigate])

  const logout = useCallback(async () => {
    try {
      await logoutService()
    } catch {
      // Ignore logout API errors, still clear local state
    } finally {
      clearAuth()
      toast.success('Déconnexion réussie')
      navigate('/login')
    }
  }, [clearAuth, navigate])

  return { user, isAuthenticated, isLoading, login, logout }
}
