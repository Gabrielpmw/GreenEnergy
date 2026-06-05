import React from 'react'
import { FolderOpen } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  actionText?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon || <FolderOpen size={48} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn-primary empty-state-btn">
          {actionText}
        </button>
      )}
    </div>
  )
}
