import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'
import { funcionarios as funcApi } from '../services/api'

function getAvatarColor(name) {
  const colors = ['#1D9E75','#3B82F6','#EF9F27','#8B5CF6','#EF4444','#F59E0B','#EC4899','#14B8A6']
  let hash = 0
  for (let i = 0; i < (name?.length ?? 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function EquipesPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: () => funcApi.list(),
  })

  const allFuncs = data?.data?.data ?? data?.data ?? []
  const filtered = allFuncs.filter((f) =>
    !search || f.nome?.toLowerCase().includes(search.toLowerCase())
  )

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const createMutation = useMutation({
    mutationFn: (data) => funcApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      toast.success('Funcionário criado!')
      setModalOpen(false)
      reset()
    },
    onError: () => toast.error('Erro ao criar funcionário.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => funcApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      toast.success('Funcionário atualizado!')
      setModalOpen(false)
      setEditTarget(null)
      reset()
    },
    onError: () => toast.error('Erro ao atualizar funcionário.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => funcApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      toast.success('Funcionário removido!')
      setConfirmDeleteId(null)
    },
    onError: () => toast.error('Erro ao remover funcionário.'),
  })

  function openCreate() {
    setEditTarget(null)
    reset()
    setModalOpen(true)
  }

  function openEdit(func) {
    setEditTarget(func)
    setValue('nome', func.nome)
    setValue('funcao', func.funcao)
    setValue('cpf', func.cpf ?? '')
    setValue('email', func.email ?? '')
    setValue('telefone', func.telefone ?? '')
    setValue('salario', func.salario ?? '')
    setModalOpen(true)
  }

  function onSubmit(formData) {
    const payload = {
      ...formData,
      salario: formData.salario ? Number(formData.salario) : undefined,
    }
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <>
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Equipes</h1>
          <Button onClick={openCreate}>
            <UserPlus size={16} /> Novo funcionário
          </Button>
        </div>

        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-3">Erro ao carregar funcionários.</p>
            <Button variant="secondary" onClick={refetch}>Tentar novamente</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100 text-gray-400">
            <p className="text-lg mb-2">Nenhum funcionário encontrado</p>
            <Button onClick={openCreate}><UserPlus size={15} /> Novo funcionário</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500">
                    <th className="text-left px-4 py-3">Funcionário</th>
                    <th className="text-left px-4 py-3">Função</th>
                    <th className="text-left px-4 py-3">Telefone</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((func) => (
                    <tr key={func.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ backgroundColor: getAvatarColor(func.nome) }}
                          >
                            {initials(func.nome)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{func.nome}</p>
                            {func.email && <p className="text-xs text-gray-400">{func.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{func.funcao}</td>
                      <td className="px-4 py-3 text-gray-500">{func.telefone || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={func.status === 'ativo' ? 'success' : 'gray'}>
                          {func.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(func)}
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          {confirmDeleteId === func.id ? (
                            <button
                              onClick={() => deleteMutation.mutate(func.id)}
                              className="px-2 py-1 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                            >
                              Confirmar?
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setConfirmDeleteId(func.id)
                                setTimeout(() => setConfirmDeleteId((cur) => cur === func.id ? null : cur), 3000)
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); reset() }}
        title={editTarget ? 'Editar funcionário' : 'Novo funcionário'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditTarget(null); reset() }}>
              Cancelar
            </Button>
            <Button loading={isPending} onClick={handleSubmit(onSubmit)}>
              {editTarget ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            {...register('nome', { required: 'Nome é obrigatório' })}
            label="Nome"
            error={errors.nome?.message}
          />
          <Input
            {...register('funcao', { required: 'Função é obrigatória' })}
            label="Função"
            placeholder="Ex: Pedreiro, Engenheiro..."
            error={errors.funcao?.message}
          />
          <Input {...register('cpf')} label="CPF (opcional)" placeholder="000.000.000-00" />
          <Input {...register('email')} label="E-mail (opcional)" type="email" />
          <Input {...register('telefone')} label="Telefone (opcional)" placeholder="(11) 99999-9999" />
          <Input
            {...register('salario', { min: { value: 0, message: 'Valor inválido' } })}
            label="Salário (opcional)"
            type="number"
            step="0.01"
            error={errors.salario?.message}
          />
        </form>
      </Modal>
    </>
  )
}
