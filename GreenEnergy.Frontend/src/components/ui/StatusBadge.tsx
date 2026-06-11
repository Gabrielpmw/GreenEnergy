import React from 'react'

interface StatusBadgeProps {
  status: string
  label?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const getBadgeClass = (statusString: string) => {
    const s = statusString.toLowerCase().replace(/[\s_-]/g, '')
    
    switch (s) {
      case 'ativo':
      case 'aprovada':
      case 'validado':
      case 'sucesso':
      case 'verde':
        return 'badge-success'
      case 'pendente':
      case 'proposta':
      case 'suspenso':
      case 'amarela':
      case 'emanalise':
      case 'ematendimento':
        return 'badge-warning'
      case 'devolvida':
      case 'defeito':
      case 'erro':
      case 'falha':
      case 'corte':
      case 'desativada':
      case 'vermelha1':
      case 'vermelha2':
        return 'badge-danger'
      default:
        return 'badge-default'
    }
  }

  return (
    <span className={`status-badge ${getBadgeClass(status)}`}>
      {label || status}
    </span>
  )
}
