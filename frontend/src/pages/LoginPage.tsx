import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { GraduationCap, Shield, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const { login, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
    } catch {
      setError('password', { message: 'Email ou mot de passe incorrect' })
    }
  }


  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary-600 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            UniBot <span className="text-primary-600">ESPA</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Centered form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Accès Administration
            </h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Connectez-vous pour gérer UniBot ESPA
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-card p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Adresse email"
                type="email"
                placeholder="admin@espa.mg"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                {...register('password')}
              />

              <Button
                type="submit"
                loading={isLoading}
                className="w-full mt-2"
              >
                Se connecter
              </Button>
            </form>

          </div>

          <p className="text-center mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            Vous avez un problème ?{' '}
            <span className="text-primary-600 dark:text-primary-400">
              Contactez votre administrateur système.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
