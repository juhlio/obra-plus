import { useAuth } from './useAuth'

export default function usePermissao() {
  const { user } = useAuth()
  return {
    isAdmin:        user?.perfil === 'admin',
    isEngenheiro:   ['admin', 'engenheiro'].includes(user?.perfil),
    isMestre:       ['admin', 'engenheiro', 'mestre'].includes(user?.perfil),
    podeEditar:     ['admin', 'engenheiro'].includes(user?.perfil),
    podeLancarMat:  ['admin', 'engenheiro', 'mestre'].includes(user?.perfil),
    somenteLeitura: user?.perfil === 'visualizador',
  }
}
