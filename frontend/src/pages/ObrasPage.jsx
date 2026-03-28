import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, MapPin, Users, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'
import { obras } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
const TIPOS = [
  { value: 'residencial', label: 'Residencial' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'infraestrutura', label: 'Infraestrutura' },
  { value: 'reforma', label: 'Reforma' },
]
const CORES = ['#1D9E75','#3B82F6','#EF9F27','#8B5CF6','#EF4444','#F59E0B']

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-1 bg-gray-200" />
        <div className="flex-1 p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    </div>
  )
}

export default function ObrasPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { user } = useAuth()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(CORES[0])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['obras', page, search, statusFilter],
    queryFn: () => obras.list({ page, search: search || undefined, status: statusFilter || undefined }),
  })

  const createMutation = useMutation({
    mutationFn: (data) => obras.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] })
      toast.success('Obra criada com sucesso!')
      setModalOpen(false)
      reset()
      setSelectedColor(CORES[0])
    },
    onError: () => toast.error('Erro ao criar obra.'),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  function onSubmit(formData) {
    createMutation.mutate({
      ...formData,
      cor: selectedColor,
      responsavel_id: user?.id,
      orcamento_total: formData.orcamento_total ? Number(formData.orcamento_total) : undefined,
    })
  }

  const obrasList = data?.data?.data ?? []
  const meta = data?.data?.meta ?? {}
  const lastPage = meta.last_page ?? 1

  return (
    <>
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Obras</h1>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Nova obra
          </Button>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar obra..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Todos os status</option>
            <option value="planejamento">Planejamento</option>
            <option value="em_andamento">Em andamento</option>
            <option value="atrasado">Atrasado</option>
            <option value="concluido">Concluído</option>
            <option value="pausado">Pausado</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-3">Erro ao carregar obras.</p>
            <Button variant="secondary" onClick={refetch}>Tentar novamente</Button>
          </div>
        ) : obrasList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-400 text-lg mb-2">Nenhuma obra encontrada</p>
            <p className="text-gray-400 text-sm mb-4">Crie sua primeira obra para começar</p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Nova obra
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {obrasList.map((obra) => (
                <div
                  key={obra.id}
                  onClick={() => navigate(`/obras/${obra.id}`)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex">
                    <div className="w-1 flex-shrink-0" style={{ backgroundColor: obra.cor ?? '#1D9E75' }} />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{obra.nome}</h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {obra.esta_atrasada && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              <AlertTriangle size={11} /> Atrasada
                            </span>
                          )}
                          <Badge status={obra.status} />
                        </div>
                      </div>

                      {(obra.cidade || obra.estado) && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                          <MapPin size={11} />
                          {[obra.cidade, obra.estado].filter(Boolean).join(', ')}
                        </p>
                      )}

                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progresso</span>
                          <span>{obra.progresso ?? 0}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${obra.progresso ?? 0}%`, backgroundColor: obra.cor ?? '#1D9E75' }}
                          />
                        </div>
                      </div>

                      {Number(obra.orcamento_total) > 0 && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>
                              {(obra.orcamento_gasto ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              {' / '}
                              {Number(obra.orcamento_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            <span>{obra.percentual_gasto ?? 0}%</span>
                          </div>
                          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-teal"
                              style={{ width: `${Math.min(obra.percentual_gasto ?? 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                        <div className="flex items-center gap-1">
                          <Users size={11} />
                          <span>{obra.funcionarios_count ?? 0} funcionários</span>
                        </div>
                        <div>
                          {obra.data_inicio && format(parseISO(obra.data_inicio), 'dd/MM/yy', { locale: ptBR })}
                          {' → '}
                          {obra.data_previsao_fim && format(parseISO(obra.data_previsao_fim), 'dd/MM/yy', { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-3">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={16} /> Anterior
                </Button>
                <span className="text-sm text-gray-600">Página {page} de {lastPage}</span>
                <Button variant="secondary" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
                  Próxima <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset(); setSelectedColor(CORES[0]) }}
        title="Nova obra"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); reset(); setSelectedColor(CORES[0]) }}>
              Cancelar
            </Button>
            <Button loading={createMutation.isPending} onClick={handleSubmit(onSubmit)}>
              Criar obra
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            {...register('nome', { required: 'Nome é obrigatório' })}
            label="Nome da obra"
            placeholder="Ex: Residencial Jardins"
            error={errors.nome?.message}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select
              {...register('tipo')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <Input
            {...register('endereco', { required: 'Endereço é obrigatório' })}
            label="Endereço"
            placeholder="Rua, número, bairro"
            error={errors.endereco?.message}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              {...register('cidade', { required: 'Cidade é obrigatória' })}
              label="Cidade"
              placeholder="São Paulo"
              error={errors.cidade?.message}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <select
                {...register('estado')}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <Input
            {...register('orcamento_total', { min: { value: 0, message: 'Valor inválido' } })}
            label="Orçamento total (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            error={errors.orcamento_total?.message}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              {...register('data_inicio', { required: 'Data de início é obrigatória' })}
              label="Data de início"
              type="date"
              error={errors.data_inicio?.message}
            />
            <Input
              {...register('data_previsao_fim', { required: 'Previsão é obrigatória' })}
              label="Previsão de término"
              type="date"
              error={errors.data_previsao_fim?.message}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Cor da obra</label>
            <div className="flex gap-2">
              {CORES.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setSelectedColor(cor)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: cor,
                    outline: selectedColor === cor ? `3px solid ${cor}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}
