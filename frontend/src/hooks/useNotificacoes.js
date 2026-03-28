import { useCallback, useEffect, useState } from 'react'
import { notificacoes as api } from '../services/api'

export function useNotificacoes() {
  const [notifs, setNotifs]     = useState([])
  const [naoLidas, setNaoLidas] = useState(0)

  const fetchNotificacoes = useCallback(() => {
    api.list()
      .then((res) => {
        setNotifs(res.data.notificacoes)
        setNaoLidas(res.data.nao_lidas)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchNotificacoes()
    const id = setInterval(fetchNotificacoes, 60_000)
    return () => clearInterval(id)
  }, [fetchNotificacoes])

  async function marcarLida(id) {
    await api.marcarLida(id)
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, lida_em: new Date().toISOString() } : n))
    setNaoLidas((v) => Math.max(0, v - 1))
  }

  async function marcarTodasLidas() {
    await api.marcarTodasLidas()
    setNotifs((prev) => prev.map((n) => ({ ...n, lida_em: n.lida_em ?? new Date().toISOString() })))
    setNaoLidas(0)
  }

  return { notificacoes: notifs, naoLidas, marcarLida, marcarTodasLidas }
}
