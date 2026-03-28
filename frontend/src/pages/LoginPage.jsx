import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/ui/Toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function LoginPage() {
  const { login }   = useAuth()
  const toast       = useToast()
  const navigate    = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm()

  async function onSubmit(data) {
    try {
      await login(data.email, data.password)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao fazer login.'
      setError('root', { message: msg })
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-bold text-xl">O+</div>
          <h1 className="text-2xl font-semibold text-gray-900">Obra+</h1>
          <p className="mt-1 text-sm text-gray-500">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="admin@obraplus.com"
            error={errors.email?.message}
            {...register('email', { required: 'E-mail obrigatório' })}
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Senha obrigatória' })}
          />

          {errors.root && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            Entrar
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Não tem conta?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
