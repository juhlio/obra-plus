import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/ui/Toast'
import { convites as convitesApi } from '../services/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'

const PERFIL_LABELS = {
  engenheiro:   'Engenheiro',
  mestre:       'Mestre de Obras',
  visualizador: 'Visualizador',
}

export default function AceitarConvitePage() {
  const { token }    = useParams()
  const navigate     = useNavigate()
  const { updateUser } = useAuth()
  const toast        = useToast()

  const [status, setStatus]   = useState('loading') // loading | valido | erro
  const [convite, setConvite] = useState(null)
  const [erroMsg, setErroMsg] = useState('')

  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm()
  const password = watch('password')

  useEffect(() => {
    convitesApi.verificar(token)
      .then((res) => {
        setConvite(res.data)
        setStatus('valido')
      })
      .catch((err) => {
        const status = err.response?.status
        const msg    = err.response?.data?.message ?? 'Convite inválido.'
        setErroMsg(status === 410 ? 'Este convite expirou.' : status === 409 ? 'Este convite já foi aceito.' : msg)
        setStatus('erro')
      })
  }, [token])

  async function onSubmit(data) {
    try {
      const res = await convitesApi.aceitar(token, {
        nome:                  data.nome,
        password:              data.password,
        password_confirmation: data.password_confirmation,
      })
      localStorage.setItem('token', res.data.token)
      updateUser(res.data.user)
      toast.success(`Bem-vindo ao Obra+, ${res.data.user.nome}!`)
      navigate('/')
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        Object.entries(apiErrors).forEach(([field, msgs]) => setError(field, { message: msgs[0] }))
      } else {
        setError('root', { message: err.response?.data?.message ?? 'Erro ao aceitar convite.' })
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-bold text-xl">O+</div>
          <h1 className="text-2xl font-semibold text-gray-900">Obra+</h1>
          <p className="mt-1 text-sm text-gray-500">Aceitar convite</p>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Spinner size="lg" className="text-primary" />
            <p className="text-sm text-gray-500">Verificando convite...</p>
          </div>
        )}

        {status === 'erro' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <span className="text-red-500 text-xl font-bold">!</span>
            </div>
            <h2 className="font-semibold text-gray-900">Convite inválido</h2>
            <p className="text-sm text-gray-500">{erroMsg}</p>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/login')}>
              Ir para login
            </Button>
          </div>
        )}

        {status === 'valido' && convite && (
          <>
            {/* Info do convite */}
            <div className="mb-4 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">
              <p className="text-sm text-teal-800">
                Você foi convidado para <strong>{convite.empresa_nome}</strong> como{' '}
                <strong>{PERFIL_LABELS[convite.perfil] ?? convite.perfil}</strong>.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <Input
                label="E-mail"
                type="email"
                value={convite.email}
                disabled
                className="bg-gray-50 text-gray-500"
              />
              <Input
                label="Seu nome completo"
                placeholder="Ex: João Silva"
                error={errors.nome?.message}
                {...register('nome', { required: 'Nome obrigatório' })}
              />
              <Input
                label="Senha"
                type="password"
                placeholder="Mínimo 8 caracteres"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Senha obrigatória',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                })}
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
                Criar conta e entrar
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
