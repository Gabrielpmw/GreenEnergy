import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface PrivateRouteProps {
  children: React.ReactNode
  allowedRoles?: ('Admin' | 'Operador' | 'Cliente')[]
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { token, user } = useAuthStore()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultRedirects = {
      Admin: '/admin/dashboard',
      Operador: '/operador/dashboard',
      Cliente: '/cliente/dashboard',
    }
    return <Navigate to={defaultRedirects[user.role] || '/login'} replace />
  }

  return <>{children}</>
}
