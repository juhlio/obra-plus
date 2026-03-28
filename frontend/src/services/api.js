import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const auth = {
  login:         (data) => client.post('/auth/login', data),
  register:      (data) => client.post('/auth/register', data),
  logout:        ()     => client.post('/auth/logout'),
  me:            ()     => client.get('/auth/me'),
  updateProfile: (data) => client.put('/auth/profile', data),
}

export const dashboard = {
  get: () => client.get('/dashboard'),
}

export const obras = {
  list:   (params) => client.get('/obras', { params }),
  get:    (id)     => client.get(`/obras/${id}`),
  create: (data)   => client.post('/obras', data),
  update: (id, data) => client.put(`/obras/${id}`, data),
  delete: (id)     => client.delete(`/obras/${id}`),
  resumo: (id)     => client.get(`/obras/${id}/resumo`),
}

export const etapas = {
  list:         (obraId)        => client.get(`/obras/${obraId}/etapas`),
  create:       (obraId, data)  => client.post(`/obras/${obraId}/etapas`, data),
  update:       (id, data)      => client.put(`/etapas/${id}`, data),
  delete:       (id)            => client.delete(`/etapas/${id}`),
  updateStatus: (id, status)    => client.patch(`/etapas/${id}/status`, { status }),
}

export const custos = {
  list:     (obraId)       => client.get(`/obras/${obraId}/custos`),
  create:   (obraId, data) => client.post(`/obras/${obraId}/custos`, data),
  update:   (id, data)     => client.put(`/custos/${id}`, data),
  delete:   (id)           => client.delete(`/custos/${id}`),
  orcamento:(obraId)       => client.get(`/obras/${obraId}/orcamento`),
}

export const funcionarios = {
  list:         (params)               => client.get('/funcionarios', { params }),
  create:       (data)                 => client.post('/funcionarios', data),
  update:       (id, data)             => client.put(`/funcionarios/${id}`, data),
  delete:       (id)                   => client.delete(`/funcionarios/${id}`),
  alocar:       (obraId, funcId, data) => client.post(`/obras/${obraId}/funcionarios/${funcId}`, data),
  desalocar:    (obraId, funcId)       => client.delete(`/obras/${obraId}/funcionarios/${funcId}`),
  updateStatus: (obraId, funcId, data) => client.patch(`/obras/${obraId}/funcionarios/${funcId}/status`, data),
}

export const materiais = {
  list:    (params) => client.get('/materiais', { params }),
  criticos: ()      => client.get('/materiais/criticos'),
  create:  (data)   => client.post('/materiais', data),
  update:  (id, data) => client.put(`/materiais/${id}`, data),
  delete:  (id)     => client.delete(`/materiais/${id}`),
}

export const movimentacoes = {
  list:    (params) => client.get('/movimentacoes', { params }),
  create:  (data)   => client.post('/movimentacoes', data),
  porObra: (obraId) => client.get(`/obras/${obraId}/movimentacoes`),
}

export const documentos = {
  list:         (obraId, params) => client.get(`/obras/${obraId}/documentos`, { params }),
  upload:       (obraId, data)   => client.post(`/obras/${obraId}/documentos`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  download:     async (id, nome) => {
    const res = await client.get(`/documentos/${id}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(res.data)
    const a   = document.createElement('a')
    a.href    = url
    a.download = nome
    a.click()
    window.URL.revokeObjectURL(url)
  },
  updateStatus: (id, status) => client.patch(`/documentos/${id}/status`, { status }),
  delete:       (id)         => client.delete(`/documentos/${id}`),
}

export const usuarios = {
  list:   (params) => client.get('/usuarios', { params }),
  update: (id, data) => client.put(`/usuarios/${id}`, data),
  delete: (id)     => client.delete(`/usuarios/${id}`),
}

export const convites = {
  list:     ()           => client.get('/usuarios/convites'),
  create:   (data)       => client.post('/usuarios/convites', data),
  delete:   (id)         => client.delete(`/usuarios/convites/${id}`),
  verificar:(token)      => client.get(`/convites/${token}/verificar`),
  aceitar:  (token, data)=> client.post(`/convites/${token}/aceitar`, data),
}

export const notificacoes = {
  list:           ()   => client.get('/notificacoes'),
  marcarLida:     (id) => client.patch(`/notificacoes/${id}/ler`),
  marcarTodasLidas: () => client.patch('/notificacoes/ler-todas'),
}

export const relatorios = {
  obra:      async (id)  => {
    const res = await client.get(`/relatorios/obra/${id}`, { responseType: 'blob' })
    _downloadBlob(res.data, `relatorio-obra-${id}.pdf`)
  },
  orcamento: async (id)  => {
    const res = await client.get(`/relatorios/orcamento/${id}`, { responseType: 'blob' })
    _downloadBlob(res.data, `orcamento-obra-${id}.pdf`)
  },
  materiais: async () => {
    const res = await client.get('/relatorios/materiais', { responseType: 'blob' })
    _downloadBlob(res.data, 'relatorio-estoque.pdf')
  },
}

function _downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href    = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export default client
