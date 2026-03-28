import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../hooks/useAuth'
import { useNotificacoes } from '../hooks/useNotificacoes'
import { auth } from '../services/api'
import { useMutation } from '@tanstack/react-query'

const notifIcon = {
  alerta: <AlertTriangle size={16} className="text-yellow-500" />,
  info:   <Info size={16} className="text-blue-500" />,
  sucesso: <CheckCircle size={16} className="text-teal" />,
  erro:   <XCircle size={16} className="text-red-500" />,
}

function relTime(date) {
  if (!date) return ''
  try {
    return formatDistanceToNow(parseISO(date), { locale: ptBR, addSuffix: true })
  } catch {
    return ''
  }
}

export default function PerfilPage() {
  const toast = useToast()
  const { user, updateUser } = useAuth()
  const { notificacoes, marcarLida, marcarTodasLidas } = useNotificacoes()

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (user) {
      reset({
        nome: user.nome ?? '',
        email: user.email ?? '',
        telefone: user.telefone ?? '',
      })
    }
  }, [user, reset])

  const profileMutation = useMutation({
    mutationFn: (data) => auth.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data.user ?? res.data)
      toast.success('Perfil atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar perfil.'),
  })

  function onSubmit(formData) {
    const payload = {
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
    }
    if (formData.password) {
      payload.password = formData.password
      payload.password_confirmation = formData.password_confirmation
    }
    profileMutation.mutate(payload)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Meus dados</h2>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              {...register('nome', { required: 'Nome é obrigatório' })}
              label="Nome"
              error={errors.nome?.message}
            />
            <Input
              {...register('email', { required: 'E-mail é obrigatório' })}
              label="E-mail"
              type="email"
              error={errors.email?.message}
            />
            <Input {...register('telefone')} label="Telefone" placeholder="(11) 99999-9999" />

            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Alterar senha</p>
              <div className="space-y-3">
                <Input
                  {...register('password', {
                    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                  })}
                  label="Nova senha"
                  type="password"
                  placeholder="Deixe em branco para não alterar"
                  error={errors.password?.message}
                />
                <Input
                  {...register('password_confirmation')}
                  label="Confirmar nova senha"
                  type="password"
                  placeholder="Repita a nova senha"
                />
              </div>
            </div>

            <Button loading={profileMutation.isPending} type="submit">
              Salvar alterações
            </Button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Notificações</h2>
            {notificacoes.some((n) => !n.lida_em) && (
              <Button variant="secondary" size="sm" onClick={marcarTodasLidas}>
                Marcar todas como lidas
              </Button>
            )}
          </div>

          {notificacoes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nenhuma notificação
            </div>
          ) : (
            <div className="space-y-2">
              {notificacoes.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    !n.lida_em ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {notifIcon[n.tipo] ?? <Info size={16} className="text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{n.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.mensagem}</p>
                    <p className="text-xs text-gray-400 mt-1">{relTime(n.created_at)}</p>
                  </div>
                  {!n.lida_em && (
                    <button
                      onClick={() => marcarLida(n.id)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Marcar como lida"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  )
}
