import React from 'react'

export const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => {
  return (
    <tr className="skeleton-row-container">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <div className="skeleton skeleton-text animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export const SkeletonCard: React.FC = () => {
  return (
    <div className="skeleton-card-container animate-pulse">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-value" />
      <div className="skeleton skeleton-subtext" />
    </div>
  )
}
