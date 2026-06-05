import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Bell, LogOut, User as UserIcon } from 'lucide-react'
import { useToast } from '../ui/Toast'
import api from '../../services/api'

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { addToast } = useToast()

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

  if (!user) return null

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="header-title">Olá, {user.nome}!</h2>
      </div>
      <div className="header-right">
        <button className="header-btn header-alert-btn" aria-label="Alertas">
          <Bell size={20} />
          <span className="header-badge">0</span>
        </button>
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
