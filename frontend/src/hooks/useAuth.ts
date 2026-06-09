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
      const error = err as Error
      toast.error(error.message ?? 'Erreur de connexion')
      throw err
    } finally {
      setLoading(false)
    }
  }, [setAuth, setLoading, navigate])

  const logout = useCallback(async () => {
    try {
      await logoutService()
    } finally {
      clearAuth()
      toast.success('Déconnexion réussie')
      navigate('/login')
    }
  }, [clearAuth, navigate])

  return { user, isAuthenticated, isLoading, login, logout }
}
