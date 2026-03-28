import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Building2, DollarSign, Users, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { dashboard } from '../services/api'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

function MetricCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ value, color = 'bg-teal' }) {
  const capped = Math.min(value, 100)
  const barColor = value > 80 ? 'bg-red-500' : value > 60 ? 'bg-primary' : color
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100">
      <div className={`h-1.5 rounded-full ${barColor} transition-all`} style={{ width: `${capped}%` }} />
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboard.get().then((r) => r.data),
  })

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size="lg" className="text-primary" />
    </div>
  )

  if (error) return (
    <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
      Erro ao carregar dashboard. Tente recarregar a página.
    </div>
  )

  const { obras, financeiro, equipe, alertas, obras_recentes, movimentacoes } = data

  const pctGasto = financeiro.percentual_gasto

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Obras ativas"
          value={obras.em_andamento}
          sub={`${obras.total} total • ${obras.atrasadas} atrasadas`}
          icon={Building2}
          color="bg-teal-light text-teal"
        />
        <MetricCard
          label="Orçamento total"
          value={`R$ ${(financeiro.orcamento_total / 1_000_000).toFixed(1)}M`}
          sub={`${pctGasto.toFixed(1)}% utilizado`}
          icon={DollarSign}
          color="bg-primary-light text-primary"
        />
        <MetricCard
          label="Funcionários"
          value={equipe.total}
          sub={`${equipe.em_campo} em campo`}
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="Alertas"
          value={alertas.materiais_criticos + alertas.obras_atrasadas}
          sub={`${alertas.materiais_criticos} mat. críticos • ${alertas.notificacoes_novas} notif.`}
          icon={AlertTriangle}
          color="bg-red-50 text-red-500"
        />
      </div>

      {/* Barra de progresso do orçamento */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Orçamento geral</span>
          <span className="text-sm font-semibold text-gray-900">{pctGasto.toFixed(1)}% utilizado</span>
        </div>
        <ProgressBar value={pctGasto} />
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Gasto: R$ {financeiro.total_gasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          <span>Saldo: R$ {financeiro.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Obras recentes */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Obras recentes</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {obras_recentes.map((obra) => (
              <li
                key={obra.id}
                className="flex cursor-pointer items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/obras/${obra.id}`)}
              >
                <div
                  className="h-9 w-9 flex-shrink-0 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: obra.cor }}
                >
                  {obra.nome.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{obra.nome}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs text-gray-500">{obra.cidade}/{obra.estado}</span>
                    <Badge status={obra.status} />
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={obra.progresso} />
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600 flex-shrink-0">{obra.progresso}%</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Últimas movimentações */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Movimentações de estoque</h2>
          </div>
          {movimentacoes.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">Nenhuma movimentação registrada.</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {movimentacoes.map((mov) => (
                <li key={mov.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full
                    ${mov.tipo === 'entrada' ? 'bg-teal-light text-teal' : 'bg-red-50 text-red-500'}`}>
                    {mov.tipo === 'entrada' ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{mov.material?.nome}</p>
                    <p className="text-xs text-gray-500">{mov.obra?.nome ?? 'Sem obra'} • {mov.usuario?.nome}</p>
                  </div>
                  <span className={`text-sm font-medium flex-shrink-0 ${mov.tipo === 'entrada' ? 'text-teal' : 'text-red-500'}`}>
                    {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade} {mov.material?.unidade}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
