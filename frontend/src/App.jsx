import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/ui/Toast'
import Layout from './components/layout/Layout'
import Spinner from './components/ui/Spinner'

import LoginPage           from './pages/LoginPage'
import RegisterPage        from './pages/RegisterPage'
import AceitarConvitePage  from './pages/AceitarConvitePage'
import UsuariosPage        from './pages/UsuariosPage'
import DashboardPage  from './pages/DashboardPage'
import ObrasPage      from './pages/ObrasPage'
import ObraDetailPage from './pages/ObraDetailPage'
import CronogramaPage from './pages/CronogramaPage'
import OrcamentoPage  from './pages/OrcamentoPage'
import EquipesPage    from './pages/EquipesPage'
import MateriaisPage  from './pages/MateriaisPage'
import DocumentosPage from './pages/DocumentosPage'
import PerfilPage     from './pages/PerfilPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function PrivateRoute({ children, requiredPerfil }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (requiredPerfil && user.perfil !== requiredPerfil) return <Navigate to="/" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login"            element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/convite/:token"  element={<AceitarConvitePage />} />

              <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index             element={<DashboardPage />} />
                <Route path="obras"      element={<ObrasPage />} />
                <Route path="obras/:id"  element={<ObraDetailPage />} />
                <Route path="cronograma" element={<CronogramaPage />} />
                <Route path="orcamento"  element={<OrcamentoPage />} />
                <Route path="equipes"    element={<EquipesPage />} />
                <Route path="materiais"  element={<MateriaisPage />} />
                <Route path="documentos" element={<DocumentosPage />} />
                <Route path="perfil"     element={<PerfilPage />} />
                <Route path="usuarios"  element={<PrivateRoute requiredPerfil="admin"><UsuariosPage /></PrivateRoute>} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
