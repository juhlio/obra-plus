import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Download, Plus, Upload, Check, X, Pencil } from 'lucide-react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'
import { obras, etapas as etapasApi, funcionarios as funcApi, documentos as docsApi, custos as custosApi, relatorios } from '../services/api'

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
const TIPOS_OBRA = ['residencial','comercial','industrial','infraestrutura','reforma']
const CORES = ['#1D9E75','#3B82F6','#EF9F27','#8B5CF6','#EF4444','#F59E0B']
const TIPOS_DOC = ['contrato','foto','planta','relatorio','outro']
const STATUS_ETAPA = ['nao_iniciado','em_andamento','concluido','atrasado','bloqueado']

function fmt(date) {
  if (!date) return '—'
  try { return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR }) } catch { return date }
}
function brl(v) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fileSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
function initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

const TABS = ['Visão Geral', 'Etapas', 'Equipe', 'Documentos', 'Custos']

export default function ObraDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [tab, setTab] = useState('Visão Geral')

  return (
    <ObraDetail id={id} navigate={navigate} queryClient={queryClient} toast={toast} tab={tab} setTab={setTab} />
  )
}

function ObraDetail({ id, navigate, queryClient, toast, tab, setTab }) {
  const { data: obraRes, isLoading, error, refetch } = useQuery({
    queryKey: ['obra', id],
    queryFn: () => obras.get(id),
  })
  const obra = obraRes?.data

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Spinner size="lg" className="text-primary" />
    </div>
  )
  if (error) return (
    <div className="text-center py-12">
      <p className="text-gray-500 mb-3">Erro ao carregar obra.</p>
      <Button variant="secondary" onClick={refetch}>Tentar novamente</Button>
    </div>
  )
  if (!obra) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/obras')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: obra.cor ?? '#1D9E75' }} />
        <h1 className="text-xl font-bold text-gray-900 flex-1">{obra.nome}</h1>
        <Badge status={obra.status} />
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Visão Geral' && <TabVisaoGeral obra={obra} id={id} queryClient={queryClient} toast={toast} />}
      {tab === 'Etapas' && <TabEtapas id={id} queryClient={queryClient} toast={toast} />}
      {tab === 'Equipe' && <TabEquipe obra={obra} id={id} queryClient={queryClient} toast={toast} />}
      {tab === 'Documentos' && <TabDocumentos id={id} queryClient={queryClient} toast={toast} />}
      {tab === 'Custos' && <TabCustos id={id} queryClient={queryClient} toast={toast} />}
    </div>
  )
}

function TabVisaoGeral({ obra, id, queryClient, toast }) {
  const [editOpen, setEditOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(obra.cor ?? CORES[0])
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      nome: obra.nome,
      tipo: obra.tipo,
      endereco: obra.endereco,
      cidade: obra.cidade,
      estado: obra.estado,
      orcamento_total: obra.orcamento_total,
      data_inicio: obra.data_inicio?.split('T')[0],
      data_previsao_fim: obra.data_previsao_fim?.split('T')[0],
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data) => obras.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra', id] })
      toast.success('Obra atualizada!')
      setEditOpen(false)
    },
    onError: () => toast.error('Erro ao atualizar obra.'),
  })

  const progresso = obra.progresso ?? 0
  const pct = obra.percentual_gasto ?? 0
  const budgetColor = pct > 85 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-teal'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Progresso', value: `${progresso}%` },
          { label: 'Orçamento', value: `${brl(obra.orcamento_gasto)} / ${brl(obra.orcamento_total)}` },
          { label: 'Funcionários', value: obra.funcionarios_count ?? 0 },
          { label: 'Documentos', value: obra.documentos_count ?? 0 },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className="text-lg font-bold text-gray-900">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Progresso geral</span>
          <span className="text-gray-500">{progresso}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progresso}%`, backgroundColor: obra.cor ?? '#1D9E75' }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <InfoRow label="Endereço" value={[obra.endereco, obra.cidade, obra.estado].filter(Boolean).join(', ')} />
        <InfoRow label="Tipo" value={obra.tipo} />
        <InfoRow label="Responsável" value={obra.responsavel?.nome ?? '—'} />
        <InfoRow label="Início" value={fmt(obra.data_inicio)} />
        <InfoRow label="Previsão de término" value={fmt(obra.data_previsao_fim)} />
        <InfoRow label="Conclusão" value={fmt(obra.data_conclusao)} />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setEditOpen(true)}>
          <Pencil size={15} /> Editar obra
        </Button>
        <Button variant="secondary" onClick={() => relatorios.obra(id).catch(() => toast.error('Erro ao gerar PDF'))}>
          <Download size={15} /> Exportar PDF
        </Button>
      </div>

      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); reset() }}
        title="Editar obra"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setEditOpen(false); reset() }}>Cancelar</Button>
            <Button loading={updateMutation.isPending} onClick={handleSubmit((d) => updateMutation.mutate({ ...d, cor: selectedColor }))}>
              Salvar
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input {...register('nome', { required: 'Obrigatório' })} label="Nome" error={errors.nome?.message} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select {...register('tipo')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              {TIPOS_OBRA.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Input {...register('endereco')} label="Endereço" />
          <div className="grid grid-cols-2 gap-3">
            <Input {...register('cidade')} label="Cidade" />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <select {...register('estado')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <Input {...register('orcamento_total')} label="Orçamento total (R$)" type="number" step="0.01" />
          <div className="grid grid-cols-2 gap-3">
            <Input {...register('data_inicio')} label="Data de início" type="date" />
            <Input {...register('data_previsao_fim')} label="Previsão de término" type="date" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Cor</label>
            <div className="flex gap-2">
              {CORES.map((cor) => (
                <button key={cor} type="button" onClick={() => setSelectedColor(cor)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: cor, outline: selectedColor === cor ? `3px solid ${cor}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value || '—'}</p>
    </div>
  )
}

function TabEtapas({ id, queryClient, toast }) {
  const [modalOpen, setModalOpen] = useState(false)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['etapas', id],
    queryFn: () => etapasApi.list(id),
  })
  const etapasList = data?.data ?? []

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const createMutation = useMutation({
    mutationFn: (data) => etapasApi.create(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas', id] })
      toast.success('Etapa criada!')
      setModalOpen(false)
      reset()
    },
    onError: () => toast.error('Erro ao criar etapa.'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ etapaId, status }) => etapasApi.updateStatus(etapaId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas', id] })
      toast.success('Status atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  })

  if (isLoading) return <div className="flex justify-center py-10"><Spinner className="text-primary" /></div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Nova etapa
        </Button>
      </div>

      {etapasList.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-100 text-gray-400">
          Nenhuma etapa cadastrada
        </div>
      ) : (
        <div className="space-y-3">
          {etapasList.map((etapa) => (
            <div key={etapa.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{etapa.nome}</p>
                  <p className="text-xs text-gray-500">{etapa.responsavel?.nome ?? 'Sem responsável'}</p>
                  <p className="text-xs text-gray-400 mt-1">{fmt(etapa.data_inicio_prevista)} → {fmt(etapa.data_fim_prevista)}</p>
                </div>
                <select
                  value={etapa.status}
                  onChange={(e) => statusMutation.mutate({ etapaId: etapa.id, status: e.target.value })}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-primary"
                >
                  {STATUS_ETAPA.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progresso</span>
                  <span>{etapa.progresso ?? 0}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal rounded-full" style={{ width: `${etapa.progresso ?? 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset() }}
        title="Nova etapa"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); reset() }}>Cancelar</Button>
            <Button loading={createMutation.isPending} onClick={handleSubmit((d) => createMutation.mutate(d))}>Criar</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input {...register('nome', { required: 'Obrigatório' })} label="Nome da etapa" error={errors.nome?.message} />
          <div className="grid grid-cols-2 gap-3">
            <Input {...register('data_inicio_prevista', { required: 'Obrigatório' })} label="Início previsto" type="date" error={errors.data_inicio_prevista?.message} />
            <Input {...register('data_fim_prevista', { required: 'Obrigatório' })} label="Fim previsto" type="date" error={errors.data_fim_prevista?.message} />
          </div>
          <Input {...register('ordem', { valueAsNumber: true })} label="Ordem" type="number" placeholder="1" />
        </form>
      </Modal>
    </div>
  )
}

function TabEquipe({ obra, id, queryClient, toast }) {
  const [modalOpen, setModalOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { data: funcsData } = useQuery({
    queryKey: ['funcionarios-list'],
    queryFn: () => funcApi.list(),
  })

  const alocarMutation = useMutation({
    mutationFn: (data) => funcApi.alocar(id, data.funcionario_id, { data_inicio: data.data_inicio }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra', id] })
      toast.success('Funcionário alocado!')
      setModalOpen(false)
      reset()
    },
    onError: () => toast.error('Erro ao alocar funcionário.'),
  })

  const equipe = obra.funcionarios ?? []
  const allFuncs = funcsData?.data?.data ?? funcsData?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Alocar funcionário
        </Button>
      </div>

      {equipe.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-100 text-gray-400">
          Nenhum funcionário alocado
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {equipe.map((func) => (
            <div key={func.id} className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {initials(func.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{func.nome}</p>
                <p className="text-xs text-gray-500">{func.funcao}</p>
              </div>
              <Badge status={func.pivot?.status ?? func.status} />
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset() }}
        title="Alocar funcionário"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); reset() }}>Cancelar</Button>
            <Button loading={alocarMutation.isPending} onClick={handleSubmit((d) => alocarMutation.mutate(d))}>Alocar</Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Funcionário</label>
            <select {...register('funcionario_id', { required: 'Obrigatório' })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">Selecione...</option>
              {allFuncs.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            {errors.funcionario_id && <p className="text-xs text-red-600">{errors.funcionario_id.message}</p>}
          </div>
          <Input {...register('data_inicio')} label="Data de início" type="date" />
        </form>
      </Modal>
    </div>
  )
}

function TabDocumentos({ id, queryClient, toast }) {
  const [file, setFile] = useState(null)
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()
  const fileRef = useRef()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['documentos', id],
    queryFn: () => docsApi.list(id),
  })
  const docs = data?.data ?? []

  const uploadMutation = useMutation({
    mutationFn: (formData) => docsApi.upload(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos', id] })
      toast.success('Documento enviado!')
      reset()
      setFile(null)
    },
    onError: () => toast.error('Erro ao enviar documento.'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ docId, status }) => docsApi.updateStatus(docId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos', id] })
      toast.success('Status atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  })

  function onUpload(formData) {
    if (!file) { toast.error('Selecione um arquivo'); return }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('nome', formData.nome)
    fd.append('tipo', formData.tipo)
    if (formData.descricao) fd.append('descricao', formData.descricao)
    uploadMutation.mutate(fd)
  }

  if (isLoading) return <div className="flex justify-center py-10"><Spinner className="text-primary" /></div>

  return (
    <div className="space-y-6">
      {docs.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-100 text-gray-400">
          Nenhum documento
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {docs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{doc.nome}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="info">{doc.tipo}</Badge>
                    <Badge status={doc.status === 'aprovado' ? 'concluido' : doc.status === 'rejeitado' ? 'atrasado' : 'planejamento'}>
                      {doc.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{fileSize(doc.tamanho)} · {fmt(doc.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" variant="secondary" onClick={() => docsApi.download(doc.id, doc.nome)}>
                  <Download size={14} /> Baixar
                </Button>
                {doc.status === 'pendente' && (
                  <>
                    <Button size="sm" variant="secondary" className="text-teal"
                      onClick={() => statusMutation.mutate({ docId: doc.id, status: 'aprovado' })}>
                      <Check size={14} />
                    </Button>
                    <Button size="sm" variant="secondary" className="text-red-500"
                      onClick={() => statusMutation.mutate({ docId: doc.id, status: 'rejeitado' })}>
                      <X size={14} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="font-medium text-gray-900 mb-4 text-sm">Enviar documento</h3>
        <form className="space-y-3" onSubmit={handleSubmit(onUpload)}>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-lg py-3 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors"
            >
              <Upload size={16} className="inline mr-2" />
              {file ? file.name : 'Selecionar arquivo'}
            </button>
            <input ref={fileRef} type="file" className="hidden"
              onChange={(e) => {
                const f = e.target.files[0]
                if (f) { setFile(f); setValue('nome', f.name) }
              }}
            />
          </div>
          <Input {...register('nome', { required: 'Obrigatório' })} label="Nome" error={errors.nome?.message} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select {...register('tipo', { required: true })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              {TIPOS_DOC.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Input {...register('descricao')} label="Descrição (opcional)" />
          <Button loading={uploadMutation.isPending} type="submit">
            <Upload size={15} /> Enviar
          </Button>
        </form>
      </div>
    </div>
  )
}

function TabCustos({ id, queryClient, toast }) {
  const [modalOpen, setModalOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { data: orcData } = useQuery({
    queryKey: ['orcamento', id],
    queryFn: () => custosApi.orcamento(id),
  })

  const { data: custosData, isLoading } = useQuery({
    queryKey: ['custos', id],
    queryFn: () => custosApi.list(id),
  })

  const createMutation = useMutation({
    mutationFn: (data) => custosApi.create(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custos', id] })
      queryClient.invalidateQueries({ queryKey: ['orcamento', id] })
      toast.success('Custo lançado!')
      setModalOpen(false)
      reset()
    },
    onError: () => toast.error('Erro ao lançar custo.'),
  })

  const orc = orcData?.data ?? {}
  const custosList = custosData?.data ?? []
  const pct = orc.percentual_gasto ?? 0
  const barColor = pct > 85 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-teal'

  const uniqueCategories = [...new Map(custosList
    .filter((c) => c.categoria)
    .map((c) => [c.categoria.id, c.categoria])
  ).values()]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Orçamento total" value={brl(orc.orcamento_total)} />
        <MetricCard label="Total realizado" value={brl(orc.total_realizado)} />
        <MetricCard label="Saldo" value={brl(orc.saldo)} />
        <MetricCard label="% Gasto" value={`${pct}%`} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Orçamento consumido</span>
          <span>{pct}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Lançar custo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6"><Spinner className="text-primary" /></div>
      ) : custosList.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl border border-gray-100 text-gray-400">
          Nenhum custo lançado
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Descrição</th>
                <th className="text-left px-4 py-3">Categoria</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-right px-4 py-3">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {custosList.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-gray-500">{fmt(c.data)}</td>
                  <td className="px-4 py-3 text-gray-900">{c.descricao}</td>
                  <td className="px-4 py-3 text-gray-500">{c.categoria?.nome ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.tipo === 'realizado' ? 'success' : 'info'}>{c.tipo}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{brl(c.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset() }}
        title="Lançar custo"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); reset() }}>Cancelar</Button>
            <Button loading={createMutation.isPending} onClick={handleSubmit((d) => createMutation.mutate({ ...d, valor: Number(d.valor) }))}>
              Lançar
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input {...register('descricao', { required: 'Obrigatório' })} label="Descrição" error={errors.descricao?.message} />
          {uniqueCategories.length > 0 ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Categoria</label>
              <select {...register('categoria_id')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="">Sem categoria</option>
                {uniqueCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
              </select>
            </div>
          ) : (
            <Input {...register('categoria_nome')} label="Categoria" placeholder="Nome da categoria" />
          )}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select {...register('tipo')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="orcado">Orçado</option>
              <option value="realizado">Realizado</option>
            </select>
          </div>
          <Input {...register('valor', { required: 'Obrigatório' })} label="Valor (R$)" type="number" step="0.01" error={errors.valor?.message} />
          <Input {...register('data', { required: 'Obrigatório' })} label="Data" type="date" error={errors.data?.message} />
        </form>
      </Modal>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  )
}
