import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, ArrowUp, ArrowDown } from 'lucide-react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'
import { materiais as materiaisApi, movimentacoes as movsApi, obras } from '../services/api'

function brl(v) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmt(date) {
  if (!date) return '—'
  try { return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR }) } catch { return date }
}

function StockBar({ atual, maximo, status }) {
  const pct = maximo > 0 ? Math.min((atual / maximo) * 100, 100) : 0
  const color = status === 'critico' ? 'bg-red-500' : status === 'atencao' ? 'bg-yellow-500' : 'bg-teal'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-12 text-right">{atual}/{maximo}</span>
    </div>
  )
}

export default function MateriaisPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [matModalOpen, setMatModalOpen] = useState(false)
  const [movModalOpen, setMovModalOpen] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['materiais'],
    queryFn: () => materiaisApi.list(),
  })

  const { data: criticosData } = useQuery({
    queryKey: ['materiais-criticos'],
    queryFn: () => materiaisApi.criticos(),
  })

  const { data: movsData } = useQuery({
    queryKey: ['movimentacoes'],
    queryFn: () => movsApi.list(),
  })

  const { data: obrasData } = useQuery({
    queryKey: ['obras-list-mat'],
    queryFn: () => obras.list({ per_page: 100 }),
  })

  const allMateriais = data?.data?.data ?? data?.data ?? []
  const criticos = criticosData?.data ?? []
  const movsList = movsData?.data?.data ?? movsData?.data ?? []
  const obrasList = obrasData?.data?.data ?? obrasData?.data ?? []

  const uniqueCategories = [...new Map(
    allMateriais.filter((m) => m.categoria).map((m) => [m.categoria.id ?? m.categoria, m.categoria])
  ).values()]

  const totalValue = allMateriais.reduce((acc, m) => acc + (Number(m.estoque_atual) * Number(m.valor_unitario || 0)), 0)
  const countAtencao = allMateriais.filter((m) => m.status_estoque === 'atencao').length
  const countCritico = allMateriais.filter((m) => m.status_estoque === 'critico').length

  const filtered = allMateriais.filter((m) => {
    if (search && !m.nome?.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && m.status_estoque !== statusFilter) return false
    if (catFilter) {
      const catId = m.categoria?.id ?? m.categoria
      if (String(catId) !== String(catFilter)) return false
    }
    return true
  })

  const { register: regMat, handleSubmit: hsMat, reset: resetMat, formState: { errors: errMat } } = useForm()
  const { register: regMov, handleSubmit: hsMov, reset: resetMov, formState: { errors: errMov } } = useForm()

  const createMatMutation = useMutation({
    mutationFn: (d) => materiaisApi.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] })
      queryClient.invalidateQueries({ queryKey: ['materiais-criticos'] })
      toast.success('Material criado!')
      setMatModalOpen(false)
      resetMat()
    },
    onError: () => toast.error('Erro ao criar material.'),
  })

  const createMovMutation = useMutation({
    mutationFn: (d) => movsApi.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] })
      queryClient.invalidateQueries({ queryKey: ['materiais-criticos'] })
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
      toast.success('Movimentação registrada!')
      setMovModalOpen(false)
      resetMov()
    },
    onError: () => toast.error('Erro ao registrar movimentação.'),
  })

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Materiais</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setMovModalOpen(true)}>
              <ArrowUp size={15} /> Movimentação
            </Button>
            <Button onClick={() => setMatModalOpen(true)}>
              <Plus size={15} /> Novo material
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Total de itens</p>
            <p className="text-lg font-bold text-gray-900">{allMateriais.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Valor em estoque</p>
            <p className="text-lg font-bold text-gray-900">{brl(totalValue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Críticos</p>
            <p className="text-lg font-bold text-red-500">{countCritico}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Atenção</p>
            <p className="text-lg font-bold text-yellow-500">{countAtencao}</p>
          </div>
        </div>

        {criticos.length > 0 && (
          <div className="bg-red-50 rounded-xl border border-red-100 p-4">
            <h3 className="text-sm font-semibold text-red-700 mb-3">Reposição urgente</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {criticos.map((m) => (
                <div key={m.id} className="bg-white rounded-lg border border-red-100 p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.nome}</p>
                  <StockBar atual={m.estoque_atual} maximo={m.estoque_minimo} status="critico" />
                  <Badge variant="danger" className="mt-1 text-xs">Crítico</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Buscar material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Todos os status</option>
            <option value="ok">OK</option>
            <option value="atencao">Atenção</option>
            <option value="critico">Crítico</option>
          </select>
          {uniqueCategories.length > 0 && (
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Todas as categorias</option>
              {uniqueCategories.map((c) => (
                <option key={c.id ?? c} value={c.id ?? c}>{c.nome ?? c}</option>
              ))}
            </select>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" className="text-primary" /></div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-3">Erro ao carregar materiais.</p>
            <Button variant="secondary" onClick={refetch}>Tentar novamente</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-400">
            Nenhum material encontrado
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500">
                    <th className="text-left px-4 py-3">Nome</th>
                    <th className="text-left px-4 py-3">Categoria</th>
                    <th className="text-left px-4 py-3">Unidade</th>
                    <th className="text-left px-4 py-3">Estoque</th>
                    <th className="text-left px-4 py-3 w-40">Nível</th>
                    <th className="text-right px-4 py-3">Valor unit.</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{m.nome}</td>
                      <td className="px-4 py-3 text-gray-500">{m.categoria?.nome ?? m.categoria ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{m.unidade}</td>
                      <td className="px-4 py-3 text-gray-700">{m.estoque_atual}</td>
                      <td className="px-4 py-3 w-40">
                        <StockBar atual={m.estoque_atual} maximo={m.estoque_maximo} status={m.status_estoque} />
                      </td>
                      <td className="px-4 py-3 text-right">{brl(m.valor_unitario)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={m.status_estoque === 'critico' ? 'danger' : m.status_estoque === 'atencao' ? 'warning' : 'success'}
                        >
                          {m.status_estoque === 'critico' ? 'Crítico' : m.status_estoque === 'atencao' ? 'Atenção' : 'OK'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {movsList.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Últimas movimentações</h3>
            <div className="space-y-2">
              {movsList.slice(0, 10).map((mov) => (
                <div key={mov.id} className="flex items-center gap-3 text-sm">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    mov.tipo === 'entrada' ? 'bg-teal-light text-teal' : 'bg-red-50 text-red-500'
                  }`}>
                    {mov.tipo === 'entrada' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900">{mov.material?.nome ?? '—'}</span>
                    <span className="text-gray-500 ml-2">{mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}</span>
                  </div>
                  <span className="text-xs text-gray-400">{fmt(mov.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Modal novo material */}
      <Modal
        open={matModalOpen}
        onClose={() => { setMatModalOpen(false); resetMat() }}
        title="Novo material"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setMatModalOpen(false); resetMat() }}>Cancelar</Button>
            <Button loading={createMatMutation.isPending} onClick={hsMat((d) => createMatMutation.mutate(d))}>Criar</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input {...regMat('nome', { required: 'Obrigatório' })} label="Nome" error={errMat.nome?.message} />
          {uniqueCategories.length > 0 ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Categoria</label>
              <select {...regMat('categoria_id')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="">Sem categoria</option>
                {uniqueCategories.map((c) => <option key={c.id ?? c} value={c.id ?? c}>{c.nome ?? c}</option>)}
              </select>
            </div>
          ) : (
            <Input {...regMat('categoria_nome')} label="Categoria" />
          )}
          <Input {...regMat('unidade', { required: 'Obrigatório' })} label="Unidade" placeholder="Ex: m², kg, un" error={errMat.unidade?.message} />
          <Input {...regMat('valor_unitario')} label="Valor unitário (R$)" type="number" step="0.01" />
          <div className="grid grid-cols-3 gap-3">
            <Input {...regMat('estoque_atual')} label="Estoque atual" type="number" />
            <Input {...regMat('estoque_minimo')} label="Mínimo" type="number" />
            <Input {...regMat('estoque_maximo')} label="Máximo" type="number" />
          </div>
        </form>
      </Modal>

      {/* Modal movimentação */}
      <Modal
        open={movModalOpen}
        onClose={() => { setMovModalOpen(false); resetMov() }}
        title="Nova movimentação"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setMovModalOpen(false); resetMov() }}>Cancelar</Button>
            <Button loading={createMovMutation.isPending} onClick={hsMov((d) => createMovMutation.mutate({ ...d, quantidade: Number(d.quantidade) }))}>
              Registrar
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Material</label>
            <select {...regMov('material_id', { required: 'Obrigatório' })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">Selecione...</option>
              {allMateriais.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
            {errMov.material_id && <p className="text-xs text-red-600">{errMov.material_id.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select {...regMov('tipo')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </div>
          <Input {...regMov('quantidade', { required: 'Obrigatório', min: { value: 1, message: 'Mínimo 1' } })}
            label="Quantidade" type="number" error={errMov.quantidade?.message} />
          <Input {...regMov('observacao')} label="Observação (opcional)" />
          {obrasList.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Obra (opcional)</label>
              <select {...regMov('obra_id')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="">Nenhuma</option>
                {obrasList.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
          )}
        </form>
      </Modal>
    </div>
  )
}
