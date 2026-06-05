import React from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'green' | 'white' | 'gray'
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'green' }) => {
  return (
    <div className={`spinner spinner-${size} spinner-${color} animate-spin`} role="status">
      <span className="sr-only">Carregando...</span>
    </div>
  )
}
