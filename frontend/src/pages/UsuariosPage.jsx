import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, UserCog, Mail, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'
import { usuarios as usuariosApi, convites as convitesApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const PERFIL_COLORS = {
  admin:        'bg-purple-100 text-purple-700',
  engenheiro:   'bg-blue-100 text-blue-700',
  mestre:       'bg-amber-100 text-amber-700',
  visualizador: 'bg-gray-100 text-gray-600',
}

const PERFIL_LABELS = {
  admin:        'Admin',
  engenheiro:   'Engenheiro',
  mestre:       'Mestre',
  visualizador: 'Visualizador',
}

const STATUS_COLORS = {
  pendente:  'bg-amber-100 text-amber-700',
  aceito:    'bg-green-100 text-green-700',
  expirado:  'bg-red-100 text-red-600',
}

function Initials({ name, perfil }) {
  const bg = {
    admin: 'bg-purple-500', engenheiro: 'bg-blue-500',
    mestre: 'bg-amber-500', visualizador: 'bg-gray-400',
  }[perfil] ?? 'bg-gray-400'
  const parts = (name || '').split(' ')
  const ini = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || 'U')[0]
  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bg} text-white text-sm font-semibold uppercase flex-shrink-0`}>
      {ini}
    </div>
  )
}

function PerfilBadge({ perfil }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PERFIL_COLORS[perfil] ?? 'bg-gray-100 text-gray-600'}`}>
      {PERFIL_LABELS[perfil] ?? perfil}
    </span>
  )
}

function relativo(date) {
  if (!date) return '—'
  try { return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: ptBR }) } catch { return date }
}

export default function UsuariosPage() {
  const { user: me } = useAuth()
  const queryClient  = useQueryClient()
  const toast        = useToast()

  const [tab, setTab]           = useState('usuarios')
  const [modalOpen, setModalOpen] = useState(false)

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['usuarios'],
    queryFn:  () => usuariosApi.list(),
  })

  const { data: convitesData, isLoading: loadingConvites } = useQuery({
    queryKey: ['convites'],
    queryFn:  () => convitesApi.list(),
  })

  const usersList   = usersData?.data ?? []
  const convitesList = convitesData?.data ?? []

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usuariosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuário atualizado.')
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Erro ao atualizar.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => usuariosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuário desativado.')
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Erro ao desativar.'),
  })

  const cancelConviteMutation = useMutation({
    mutationFn: (id) => convitesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convites'] })
      toast.success('Convite cancelado.')
    },
    onError: () => toast.error('Erro ao cancelar convite.'),
  })

  const reenviarMutation = useMutation({
    mutationFn: async (convite) => {
      await convitesApi.delete(convite.id)
      return convitesApi.create({ email: convite.email, perfil: convite.perfil })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convites'] })
      toast.success('Novo convite enviado!')
    },
    onError: () => toast.error('Erro ao reenviar convite.'),
  })

  // ── Form convite ───────────────────────────────────────────────────────────
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm()

  async function onConvite(data) {
    try {
      await convitesApi.create(data)
      queryClient.invalidateQueries({ queryKey: ['convites'] })
      toast.success(`Convite enviado para ${data.email}`)
      setModalOpen(false)
      reset()
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao enviar convite.'
      setError('root', { message: msg })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Convidar usuário
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'usuarios', label: 'Usuários ativos' },
          { key: 'convites', label: `Convites (${convitesList.filter(c => c.status === 'pendente').length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Usuários */}
      {tab === 'usuarios' && (
        loadingUsers ? (
          <div className="flex justify-center py-10"><Spinner size="lg" className="text-primary" /></div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="text-left px-4 py-3">Usuário</th>
                  <th className="text-left px-4 py-3">Perfil</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Cadastrado</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usersList.map((u) => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${u.id === me?.id ? 'bg-primary-light/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Initials name={u.nome} perfil={u.perfil} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{u.nome}</span>
                            {u.id === me?.id && (
                              <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-medium">Você</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.id === me?.id ? (
                        <PerfilBadge perfil={u.perfil} />
                      ) : (
                        <select
                          value={u.perfil}
                          onChange={(e) => updateMutation.mutate({ id: u.id, data: { perfil: e.target.value } })}
                          className="text-xs rounded-lg border border-gray-200 px-2 py-1 outline-none focus:border-primary"
                        >
                          <option value="admin">Admin</option>
                          <option value="engenheiro">Engenheiro</option>
                          <option value="mestre">Mestre</option>
                          <option value="visualizador">Visualizador</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{relativo(u.created_at)}</td>
                    <td className="px-4 py-3">
                      {u.id !== me?.id && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title={u.ativo ? 'Desativar' : 'Ativar'}
                            onClick={() => updateMutation.mutate({ id: u.id, data: { ativo: !u.ativo } })}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          >
                            {u.ativo ? <ToggleRight size={17} className="text-green-500" /> : <ToggleLeft size={17} />}
                          </button>
                          <button
                            title="Remover"
                            onClick={() => {
                              if (confirm(`Desativar ${u.nome}?`)) deleteMutation.mutate(u.id)
                            }}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Tab: Convites */}
      {tab === 'convites' && (
        loadingConvites ? (
          <div className="flex justify-center py-10"><Spinner size="lg" className="text-primary" /></div>
        ) : convitesList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-400">
            Nenhum convite enviado ainda
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="text-left px-4 py-3">E-mail</th>
                  <th className="text-left px-4 py-3">Perfil</th>
                  <th className="text-left px-4 py-3">Convidado por</th>
                  <th className="text-left px-4 py-3">Enviado</th>
                  <th className="text-left px-4 py-3">Expiração</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {convitesList.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900">{c.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><PerfilBadge perfil={c.perfil} /></td>
                    <td className="px-4 py-3 text-gray-500">{c.convidado_por?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{relativo(c.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {c.status === 'pendente' ? relativo(c.expires_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {c.status === 'expirado' && (
                          <button
                            onClick={() => reenviarMutation.mutate(c)}
                            disabled={reenviarMutation.isPending}
                            className="text-xs text-primary hover:underline disabled:opacity-50"
                          >
                            Reenviar
                          </button>
                        )}
                        {c.status === 'pendente' && (
                          <button
                            title="Cancelar convite"
                            onClick={() => cancelConviteMutation.mutate(c.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal convidar */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset() }}
        title="Convidar usuário"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); reset() }}>Cancelar</Button>
            <Button loading={isSubmitting} onClick={handleSubmit(onConvite)}>Enviar convite</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onConvite)}>
          <Input
            label="E-mail"
            type="email"
            placeholder="colaborador@empresa.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'E-mail obrigatório',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'E-mail inválido' },
            })}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Perfil</label>
            <select
              {...register('perfil', { required: 'Selecione um perfil' })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Selecione...</option>
              <option value="engenheiro">Engenheiro — ver e editar obras</option>
              <option value="mestre">Mestre — ver obras e lançar materiais</option>
              <option value="visualizador">Visualizador — somente visualização</option>
            </select>
            {errors.perfil && <p className="text-xs text-red-600">{errors.perfil.message}</p>}
          </div>

          {errors.root && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</p>
          )}
        </form>
      </Modal>
    </div>
  )
}
