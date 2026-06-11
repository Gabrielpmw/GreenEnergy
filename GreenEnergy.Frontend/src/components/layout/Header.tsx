import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Bell, LogOut, User as UserIcon, Check } from 'lucide-react'
import { useToast } from '../ui/Toast'
import api from '../../services/api'
import { formatDate } from '../../utils/format'

interface Alerta {
  id: number;
  usuarioId: number;
  dispositivoId: number | null;
  dispositivoNome: string | null;
  mensagem: string;
  tipo: string;
  lido: boolean;
  geradoEm: string;
}

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchAlertas = async () => {
    if (!user) return
    try {
      const response = await api.get('/alertas')
      if (response.data && response.data.success) {
        setAlertas(response.data.data)
      }
    } catch (err) {
      console.warn('Erro ao carregar alertas:', err)
    }
  }

  // Polling de alertas a cada 30 segundos
  useEffect(() => {
    fetchAlertas()
    const interval = setInterval(fetchAlertas, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Fecha o dropdown se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.warn('Erro ao invalidar token no backend:', err)
    } finally {
      logout()
      addToast('Sessão encerrada com sucesso.', 'success')
      navigate('/login')
    }
  }

  const handleMarcarComoLido = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await api.patch(`/alertas/${id}/lido`)
      if (response.data && response.data.success) {
        setAlertas((prev) =>
          prev.map((alerta) => (alerta.id === id ? { ...alerta, lido: true } : alerta))
        )
        addToast('Notificação marcada como lida.', 'success')
      }
    } catch (err) {
      addToast('Erro ao atualizar notificação.', 'error')
    }
  }

  const handleMarcarTodosComoLidos = async () => {
    try {
      const response = await api.post('/alertas/marcar-lidos')
      if (response.data && response.data.success) {
        setAlertas((prev) => prev.map((alerta) => ({ ...alerta, lido: true })))
        addToast('Todas as notificações foram marcadas como lidas.', 'success')
      }
    } catch (err) {
      addToast('Erro ao atualizar notificações.', 'error')
    }
  }

  if (!user) return null

  const unreadCount = alertas.filter((a) => !a.lido).length

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="header-title">Olá, {user.nome}!</h2>
      </div>
      <div className="header-right">
        <div className="header-alert-wrapper" style={{ position: 'relative' }} ref={dropdownRef}>
          <button 
            className="header-btn header-alert-btn" 
            aria-label="Alertas"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="header-badge">{unreadCount}</span>
            )}
          </button>

          {showDropdown && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <span className="notifications-header-title">Notificações</span>
                {unreadCount > 0 && (
                  <button 
                    className="notifications-clear-btn"
                    onClick={handleMarcarTodosComoLidos}
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="notifications-list">
                {alertas.length === 0 ? (
                  <div className="notification-empty">
                    Nenhuma notificação por aqui.
                  </div>
                ) : (
                  alertas.map((alerta) => {
                    const isCritico = alerta.tipo === 'Critico';
                    return (
                      <div 
                        key={alerta.id} 
                        className={`notification-item ${alerta.lido ? '' : 'unread'} ${isCritico ? 'critico' : ''}`}
                      >
                        <p className="notification-msg">{alerta.mensagem}</p>
                        <div className="notification-meta">
                          <span>{formatDate(alerta.geradoEm)}</span>
                          {!alerta.lido && (
                            <button
                              onClick={(e) => handleMarcarComoLido(alerta.id, e)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--green-700)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                fontSize: '10px',
                                fontWeight: '600'
                              }}
                              title="Marcar como lido"
                            >
                              <Check size={10} />
                              Lido
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-profile-menu">
          <button 
            className="header-btn header-profile-btn"
            onClick={() => navigate(user.role === 'Cliente' ? '/cliente/perfil' : '#')}
          >
            <UserIcon size={20} />
            <span className="header-profile-name">{user.nome}</span>
          </button>
        </div>
        <button className="header-btn header-logout-btn" onClick={handleLogout} aria-label="Sair">
          <LogOut size={20} />
          <span className="header-logout-text">Sair</span>
        </button>
      </div>
    </header>
  )
}
