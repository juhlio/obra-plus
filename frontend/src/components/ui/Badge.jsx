const variants = {
  success: 'bg-teal-light text-teal-dark',
  warning: 'bg-primary-light text-primary-dark',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-700',
  gray:    'bg-gray-100 text-gray-600',
}

const statusMap = {
  em_andamento: 'success',
  planejamento: 'warning',
  atrasado:     'danger',
  concluido:    'info',
  pausado:      'gray',
  cancelado:    'gray',
  nao_iniciado: 'gray',
  bloqueado:    'danger',
}

const statusLabel = {
  em_andamento: 'Em andamento',
  planejamento: 'Planejamento',
  atrasado:     'Atrasado',
  concluido:    'Concluído',
  pausado:      'Pausado',
  cancelado:    'Cancelado',
  nao_iniciado: 'Não iniciado',
  bloqueado:    'Bloqueado',
}

export default function Badge({ variant, status, children, className = '' }) {
  const v = variant ?? statusMap[status] ?? 'gray'
  const label = children ?? statusLabel[status] ?? status
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[v]} ${className}`}>
      {label}
    </span>
  )
}
