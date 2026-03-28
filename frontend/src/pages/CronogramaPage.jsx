import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { obras, etapas as etapasApi } from '../services/api'

function fmt(date) {
  if (!date) return ''
  try { return format(parseISO(date), 'dd/MM/yy', { locale: ptBR }) } catch { return '' }
}

const statusColor = {
  concluido:    'bg-teal',
  em_andamento: 'bg-blue-500',
  nao_iniciado: 'bg-amber-400',
  atrasado:     'bg-red-500',
  bloqueado:    'bg-gray-400',
}

function getMonths(start, end) {
  if (!start || !end) return []
  const months = []
  const d = parseISO(start)
  const endD = parseISO(end)
  let cur = new Date(d.getFullYear(), d.getMonth(), 1)
  while (cur <= endD) {
    months.push(new Date(cur))
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }
  return months
}

export default function CronogramaPage() {
  const [selectedObraId, setSelectedObraId] = useState('')

  const { data: obrasData, isLoading: obrasLoading } = useQuery({
    queryKey: ['obras-list'],
    queryFn: () => obras.list({ per_page: 100 }),
  })

  const obrasList = obrasData?.data?.data ?? obrasData?.data ?? []

  const selectedObra = obrasList.find((o) => String(o.id) === String(selectedObraId))

  const { data: etapasData, isLoading: etapasLoading } = useQuery({
    queryKey: ['etapas-gantt', selectedObraId],
    queryFn: () => etapasApi.list(selectedObraId),
    enabled: !!selectedObraId,
  })

  const etapasList = etapasData?.data ?? []

  const periodoInicio = selectedObra?.data_inicio
  const periodoFim = selectedObra?.data_previsao_fim
  const totalDias = periodoInicio && periodoFim
    ? differenceInDays(parseISO(periodoFim), parseISO(periodoInicio))
    : 0

  const months = periodoInicio && periodoFim ? getMonths(periodoInicio, periodoFim) : []

  const today = new Date()
  const todayPct = periodoInicio && periodoFim && totalDias > 0
    ? Math.max(0, Math.min(100, differenceInDays(today, parseISO(periodoInicio)) / totalDias * 100))
    : null

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Cronograma</h1>

        <div className="flex items-center gap-3">
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
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap">
          {[
            { label: 'Concluído', color: 'bg-teal' },
            { label: 'Em andamento', color: 'bg-blue-500' },
            { label: 'Planejamento', color: 'bg-amber-400' },
            { label: 'Atrasado', color: 'bg-red-500' },
            { label: 'Bloqueado', color: 'bg-gray-400' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className={`w-3 h-3 rounded ${l.color}`} />
              {l.label}
            </div>
          ))}
        </div>

        {!selectedObraId ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100 text-gray-400">
            Selecione uma obra para visualizar o cronograma
          </div>
        ) : etapasLoading ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-primary" />
          </div>
        ) : etapasList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100 text-gray-400">
            Nenhuma etapa cadastrada para esta obra
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '700px' }}>
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-64">Etapa</th>
                    <th className="px-4 py-3 w-full relative">
                      <div className="flex">
                        {months.map((m, i) => (
                          <div key={i} className="flex-1 text-xs text-gray-400 font-normal text-center border-l border-gray-100 first:border-l-0 py-1">
                            {format(m, 'MMM/yy', { locale: ptBR })}
                          </div>
                        ))}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {etapasList.map((etapa) => {
                    let leftPct = 0
                    let widthPct = 10
                    if (periodoInicio && etapa.data_inicio_prevista && totalDias > 0) {
                      const startDiff = differenceInDays(
                        parseISO(etapa.data_inicio_prevista),
                        parseISO(periodoInicio)
                      )
                      leftPct = Math.max(0, (startDiff / totalDias) * 100)

                      if (etapa.data_fim_prevista) {
                        const dur = differenceInDays(
                          parseISO(etapa.data_fim_prevista),
                          parseISO(etapa.data_inicio_prevista)
                        )
                        widthPct = Math.max(2, (dur / totalDias) * 100)
                      }
                    }
                    const color = statusColor[etapa.status] ?? 'bg-gray-300'
                    return (
                      <tr key={etapa.id}>
                        <td className="px-4 py-3 w-64">
                          <p className="text-sm font-medium text-gray-900 truncate">{etapa.nome}</p>
                          <Badge status={etapa.status} className="mt-1" />
                        </td>
                        <td className="px-4 py-3 relative" style={{ height: '52px' }}>
                          <div className="relative w-full h-6">
                            {todayPct !== null && (
                              <div
                                className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                                style={{ left: `${todayPct}%` }}
                              />
                            )}
                            <div
                              className={`absolute top-1 h-4 rounded-md ${color} opacity-90 flex items-center px-1`}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '6px' }}
                              title={`${fmt(etapa.data_inicio_prevista)} → ${fmt(etapa.data_fim_prevista)}`}
                            >
                              <span className="text-white text-xs truncate hidden sm:block">
                                {etapa.nome}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
  )
}
