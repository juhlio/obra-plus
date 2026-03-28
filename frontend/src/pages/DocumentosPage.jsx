import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Image, Map, BarChart2, File, Download, Check, X, Upload, AlertTriangle } from 'lucide-react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'
import { obras, documentos as docsApi } from '../services/api'

function fmt(date) {
  if (!date) return '—'
  try { return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR }) } catch { return date }
}
function fileSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const TIPOS_DOC = ['contrato','foto','planta','relatorio','outro']

const tipoIcon = {
  contrato: FileText,
  foto: Image,
  planta: Map,
  relatorio: BarChart2,
  outro: File,
}

const tipoColor = {
  contrato: 'text-blue-600 bg-blue-50',
  foto: 'text-teal bg-teal-light',
  planta: 'text-purple-600 bg-purple-50',
  relatorio: 'text-primary bg-primary-light',
  outro: 'text-gray-500 bg-gray-100',
}

export default function DocumentosPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [selectedObraId, setSelectedObraId] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const { data: obrasData, isLoading: obrasLoading } = useQuery({
    queryKey: ['obras-docs'],
    queryFn: () => obras.list({ per_page: 100 }),
  })
  const obrasList = obrasData?.data?.data ?? obrasData?.data ?? []

  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ['documentos-page', selectedObraId],
    queryFn: () => docsApi.list(selectedObraId),
    enabled: !!selectedObraId,
  })
  const allDocs = docsData?.data ?? []

  const filteredDocs = tipoFilter ? allDocs.filter((d) => d.tipo === tipoFilter) : allDocs

  const uploadMutation = useMutation({
    mutationFn: (fd) => docsApi.upload(selectedObraId, fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-page', selectedObraId] })
      toast.success('Documento enviado!')
      reset()
      setFile(null)
    },
    onError: () => toast.error('Erro ao enviar documento.'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ docId, status }) => docsApi.updateStatus(docId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-page', selectedObraId] })
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

  const today = new Date()

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>

        <div className="flex items-center gap-3 flex-wrap">
          {obrasLoading ? (
            <Spinner size="sm" className="text-primary" />
          ) : (
            <select
              value={selectedObraId}
              onChange={(e) => setSelectedObraId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary min-w-[280px]"
            >
              <option value="">Selecione uma obra...</option>
              {obrasList.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          )}
          {selectedObraId && (
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Todos os tipos</option>
              {TIPOS_DOC.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {!selectedObraId ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100 text-gray-400">
            Selecione uma obra para ver os documentos
          </div>
        ) : docsLoading ? (
          <div className="flex justify-center py-10"><Spinner className="text-primary" /></div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-gray-100 text-gray-400">
            Nenhum documento encontrado
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const Icon = tipoIcon[doc.tipo] ?? File
              const iconClass = tipoColor[doc.tipo] ?? 'text-gray-500 bg-gray-100'
              const daysToExpire = doc.data_vencimento
                ? differenceInDays(parseISO(doc.data_vencimento), today)
                : null

              return (
                <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{doc.nome}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="info">{doc.tipo}</Badge>
                        <Badge
                          variant={doc.status === 'aprovado' ? 'success' : doc.status === 'rejeitado' ? 'danger' : 'warning'}
                        >
                          {doc.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{fileSize(doc.tamanho)} · {fmt(doc.created_at)}</p>
                      {daysToExpire !== null && daysToExpire <= 30 && (
                        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                          <AlertTriangle size={11} />
                          Vence em {daysToExpire} dias
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="secondary" onClick={() => docsApi.download(doc.id, doc.nome)}>
                      <Download size={13} /> Baixar
                    </Button>
                    {doc.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => statusMutation.mutate({ docId: doc.id, status: 'aprovado' })}
                          className="p-1.5 text-teal bg-teal-light rounded-lg hover:opacity-80"
                          title="Aprovar"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => statusMutation.mutate({ docId: doc.id, status: 'rejeitado' })}
                          className="p-1.5 text-red-500 bg-red-50 rounded-lg hover:opacity-80"
                          title="Rejeitar"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {selectedObraId && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Enviar documento</h3>
            <form className="space-y-3" onSubmit={handleSubmit(onUpload)}>
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg py-3 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={15} />
                  {file ? file.name : 'Selecionar arquivo'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files[0]
                    if (f) { setFile(f); setValue('nome', f.name) }
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  {...register('nome', { required: 'Obrigatório' })}
                  label="Nome do documento"
                  error={errors.nome?.message}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    {...register('tipo', { required: true })}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {TIPOS_DOC.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <Input {...register('descricao')} label="Descrição (opcional)" />
              </div>
              <Button loading={uploadMutation.isPending} type="submit">
                <Upload size={15} /> Enviar documento
              </Button>
            </form>
          </div>
        )}
      </div>
  )
}
