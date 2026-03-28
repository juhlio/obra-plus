import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Building2, CalendarDays, DollarSign,
  Users, Package, FileText, Bell, Menu, X, LogOut, User,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNotificacoes } from '../../hooks/useNotificacoes'

const navItems = [
  { to: '/',           label: 'Painel',      icon: LayoutDashboard },
  { to: '/obras',      label: 'Obras',       icon: Building2 },
  { to: '/cronograma', label: 'Cronograma',  icon: CalendarDays },
  { to: '/orcamento',  label: 'Orçamento',   icon: DollarSign },
  { to: '/equipes',    label: 'Equipes',     icon: Users },
  { to: '/materiais',  label: 'Materiais',   icon: Package },
  { to: '/documentos', label: 'Documentos',  icon: FileText },
]

const pageTitles = {
  '/':           'Painel',
  '/obras':      'Obras',
  '/cronograma': 'Cronograma',
  '/orcamento':  'Orçamento',
  '/equipes':    'Equipes',
  '/materiais':  'Materiais',
  '/documentos': 'Documentos',
  '/perfil':     'Meu Perfil',
}

function Initials({ name }) {
  const parts = (name || '').split(' ')
  const initials = parts.length > 1
    ? parts[0][0] + parts[parts.length - 1][0]
    : (parts[0] || 'U')[0]
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold uppercase">
      {initials}
    </div>
  )
}

export default function Layout() {
  const { user, logout }      = useAuth()
  const { naoLidas }          = useNotificacoes()
  const navigate              = useNavigate()
  const { pathname }          = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const pageTitle = Object.entries(pageTitles).find(([p]) =>
    pathname === p || (p !== '/' && pathname.startsWith(p))
  )?.[1] ?? 'Obra+'

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const sidebar = (
    <aside className="flex h-full w-[220px] flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">O+</div>
        <span className="font-semibold text-gray-900">Obra+</span>
      </div>

      {/* Empresa */}
      <div className="px-5 py-3 border-b border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Empresa</p>
        <p className="text-sm font-medium text-gray-700 truncate">{user?.empresa?.nome ?? '—'}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-light text-primary-dark'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-3 py-3">
        <div className="flex items-center gap-2">
          <Initials name={user?.nome} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{user?.nome}</p>
            <p className="text-xs text-gray-400 truncate">{user?.perfil}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 flex">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-semibold text-gray-900">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <Bell size={18} />
              {naoLidas > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                  {naoLidas > 9 ? '9+' : naoLidas}
                </span>
              )}
            </button>

            {/* Avatar */}
            <NavLink to="/perfil">
              <Initials name={user?.nome} />
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
