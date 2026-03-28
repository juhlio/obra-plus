import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { obras, custos as custosApi, relatorios } from '../services/api'
import { useToast } from '../components/ui/Toast'

function brl(v) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmt(date) {
  if (!date) return '—'
  try { return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR }) } catch { return date }
}

const PIE_COLORS = ['#1D9E75','#3B82F6','#EF9F27','#8B5CF6','#EF4444','#F59E0B','#EC4899','#14B8A6']

export default function OrcamentoPage() {
  const toast = useToast()
  const [selectedObraId, setSelectedObraId] = useState('')
  const [tipoFilter, setTipoFilter] = useState('todos')

  const { data: obrasData, isLoading: obrasLoading } = useQuery({
    queryKey: ['obras-orcamento'],
    queryFn: () => obras.list({ per_page: 100 }),
  })
  const obrasList = obrasData?.data?.data ?? obrasData?.data ?? []

  const { data: orcData, isLoading: orcLoading } = useQuery({
    queryKey: ['orcamento-detail', selectedObraId],
    queryFn: () => custosApi.orcamento(selectedObraId),
    enabled: !!selectedObraId,
  })

  const { data: custosData, isLoading: custosLoading } = useQuery({
    queryKey: ['custos-orcamento', selectedObraId],
    queryFn: () => custosApi.list(selectedObraId),
    enabled: !!selectedObraId,
  })

  const orc = orcData?.data ?? {}
  const pct = orc.percentual_gasto ?? 0
  const barColor = pct > 85 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-teal'

  const allCustos = custosData?.data ?? []
  const filteredCustos = tipoFilter === 'todos'
    ? allCustos
    : allCustos.filter((c) => c.tipo === tipoFilter)

  const barData = obrasList.map((o) => ({
    nome: o.nome?.length > 12 ? o.nome.slice(0, 12) + '…' : o.nome,
    total: Number(o.orcamento_total) || 0,
    gasto: Number(o.orcamento_gasto) || 0,
  }))

  const pieData = (orc.por_categoria ?? []).map((c) => ({
    name: c.categoria ?? 'Outros',
    value: Number(c.total) || 0,
  }))

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Orçamento</h1>

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
            <Button variant="secondary" size="sm"
              onClick={() => relatorios.orcamento(selectedObraId).catch(() => toast.error('Erro ao gerar PDF'))}>
              Exportar PDF
            </Button>
          )}
        </div>

        {selectedObraId && orcLoading ? (
          <div className="flex justify-center py-10"><Spinner className="text-primary" /></div>
        ) : selectedObraId ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Orçamento total', value: brl(orc.orcamento_total) },
                { label: 'Total realizado', value: brl(orc.total_realizado) },
                { label: 'Saldo', value: brl(orc.saldo) },
                { label: '% Gasto', value: `${pct}%` },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                  <p className="text-lg font-bold text-gray-900">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Todas as obras</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData} margin={{ top: 0, right: 10, left: 0, bottom: 20 }}>
                    <XAxis dataKey="nome" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => brl(v)} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="total" name="Orçamento" fill="#D1D5DB" radius={[3,3,0,0]} />
                    <Bar dataKey="gasto" name="Gasto" fill="#1D9E75" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Custos por categoria</h3>
                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
                    Sem dados de categorias
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name }) => name}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => brl(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Lançamentos</h3>
                <div className="flex gap-1">
                  {['todos','orcado','realizado'].map((t) => (
                    <button key={t} onClick={() => setTipoFilter(t)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        tipoFilter === t ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {t === 'todos' ? 'Todos' : t === 'orcado' ? 'Orçado' : 'Realizado'}
                    </button>
                  ))}
                </div>
              </div>
              {custosLoading ? (
                <div className="flex justify-center py-6"><Spinner className="text-primary" /></div>
              ) : filteredCustos.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Nenhum lançamento</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-100">
                        <th className="text-left px-4 py-3">Data</th>
                        <th className="text-left px-4 py-3">Descrição</th>
                        <th className="text-left px-4 py-3">Categoria</th>
                        <th className="text-left px-4 py-3">Tipo</th>
                        <th className="text-right px-4 py-3">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredCustos.map((c) => (
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
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100 text-gray-400">
            Selecione uma obra para visualizar o orçamento
          </div>
        )}
      </div>
  )
}
