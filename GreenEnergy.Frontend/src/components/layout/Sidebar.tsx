import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard,
  Home,
  Cpu,
  Wrench,
  Target,
  BarChart3,
  DollarSign,
  Radio,
  FileText,
  Tags,
  Users,
  Settings,
  ShieldAlert,
  Leaf,
  Compass
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore()

  if (!user) return null

  const getNavItems = () => {
    switch (user.role) {
      case 'Cliente':
        return [
          { to: '/cliente/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
          { to: '/cliente/unidades', label: 'Unidades', icon: <Home size={20} /> },
          { to: '/cliente/dispositivos', label: 'Dispositivos', icon: <Cpu size={20} /> },
          { to: '/cliente/chamados', label: 'Chamados', icon: <Wrench size={20} /> },
          { to: '/cliente/metas', label: 'Metas', icon: <Target size={20} /> },
          { to: '/cliente/comparativos', label: 'Comparativos', icon: <BarChart3 size={20} /> },
          { to: '/cliente/tarifas', label: 'Tarifas', icon: <DollarSign size={20} /> },
        ]
      case 'Operador':
        return [
          { to: '/operador/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
          { to: '/operador/chamados', label: 'Chamados', icon: <Wrench size={20} /> },
          { to: '/operador/dispositivos', label: 'Dispositivos', icon: <Cpu size={20} /> },
          { to: '/operador/sensores', label: 'Sensores', icon: <Radio size={20} /> },
          { to: '/operador/metas', label: 'Metas', icon: <Target size={20} /> },
          { to: '/operador/relatorios', label: 'Relatórios', icon: <FileText size={20} /> },
          { to: '/operador/categorias', label: 'Categorias', icon: <Tags size={20} /> },
          { to: '/operador/clientes', label: 'Clientes', icon: <Users size={20} /> },
        ]
      case 'Admin':
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
          { to: '/admin/usuarios', label: 'Usuários', icon: <Users size={20} /> },
          { to: '/admin/tarifas', label: 'Tarifas', icon: <DollarSign size={20} /> },
          { to: '/admin/configuracoes/apis', label: 'Config. APIs', icon: <Settings size={20} /> },
          { to: '/admin/auditoria', label: 'Auditoria', icon: <ShieldAlert size={20} /> },
          { to: '/admin/mercado', label: 'Penetração de Mercado', icon: <Compass size={20} /> },
        ]
      default:
        return []
    }
  }

  const items = getNavItems()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Leaf size={24} className="sidebar-brand-icon" />
        <span className="sidebar-brand-text">GreenEnergy</span>
      </div>
      <div className="sidebar-user-info">
        <span className="sidebar-role-badge">{user.role}</span>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
