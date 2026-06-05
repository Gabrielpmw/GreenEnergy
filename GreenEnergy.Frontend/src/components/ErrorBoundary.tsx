import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-card">
            <div className="error-card-icon">
              <AlertTriangle size={32} />
            </div>
            <h4 className="error-card-title">Erro de Renderização</h4>
            <p className="error-card-message">
              Ocorreu um erro inesperado neste componente.
            </p>
            {this.state.error && (
              <pre className="error-card-details">{this.state.error.message}</pre>
            )}
            <button 
              onClick={() => this.setState({ hasError: false, error: null })} 
              className="btn-secondary error-card-btn"
            >
              Tentar Novamente
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}

export const ErrorCard: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry
}) => {
  return (
    <div className="error-card">
      <div className="error-card-icon">
        <AlertTriangle size={32} />
      </div>
      <h4 className="error-card-title">Ops! Algo deu errado</h4>
      <p className="error-card-message">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary error-card-btn">
          Tentar Novamente
        </button>
      )}
    </div>
  )
}
