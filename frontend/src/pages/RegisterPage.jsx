import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm()
  const password = watch('password')

  async function onSubmit(data) {
    try {
      await registerUser(data)
      navigate('/')
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        Object.entries(apiErrors).forEach(([field, msgs]) => {
          setError(field, { message: msgs[0] })
        })
      } else {
        setError('root', { message: err.response?.data?.message ?? 'Erro ao criar conta.' })
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-bold text-xl">O+</div>
          <h1 className="text-2xl font-semibold text-gray-900">Criar conta</h1>
          <p className="mt-1 text-sm text-gray-500">Cadastre sua empresa e comece agora</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <Input
            label="Nome da empresa"
            placeholder="Construtora Exemplo Ltda"
            error={errors.empresa_nome?.message}
            {...register('empresa_nome', { required: 'Nome da empresa obrigatório' })}
          />
          <Input
            label="Seu nome"
            placeholder="Carlos Rocha"
            error={errors.nome?.message}
            {...register('nome', { required: 'Nome obrigatório' })}
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="voce@empresa.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'E-mail obrigatório',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'E-mail inválido' },
            })}
          />
          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            error={errors.password?.message}
            {...register('password', { required: 'Senha obrigatória', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
          />
          <Input
            label="Confirmar senha"
            type="password"
            placeholder="Repita a senha"
            error={errors.password_confirmation?.message}
            {...register('password_confirmation', {
              required: 'Confirmação obrigatória',
              validate: (v) => v === password || 'As senhas não coincidem',
            })}
          />

          {errors.root && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            Criar conta
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
