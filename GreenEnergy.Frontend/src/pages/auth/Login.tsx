import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { Leaf, Cpu, Target, ShieldCheck } from 'lucide-react'

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { addToast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !senha) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    setIsLoading(true)

    try {
      const response = await api.post('/auth/login', { email, senha })
      const apiResponse = response.data

      if (apiResponse.success && apiResponse.data) {
        const { token, refreshToken, role, usuarioId, nome } = apiResponse.data

        login(token, refreshToken, {
          id: String(usuarioId),
          nome,
          email,
          role: role as 'Admin' | 'Operador' | 'Cliente',
        })

        addToast(`Bem-vindo, ${nome}!`, 'success')

        if (role === 'Admin') {
          navigate('/admin/dashboard')
        } else if (role === 'Operador') {
          navigate('/operador/dashboard')
        } else {
          navigate('/cliente/dashboard')
        }
      } else {
        setError(apiResponse.message || 'Falha na autenticação.')
      }
    } catch (err: any) {
      console.error(err)
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        'Não foi possível conectar ao servidor. Verifique suas credenciais.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-info-section">
        <div className="register-info-content">
          <div className="register-info-logo">
            <Leaf size={36} />
            <span style={{ fontSize: '24px', fontWeight: '800' }}>GreenEnergy</span>
          </div>
          <h1 className="register-info-title">Assuma o controle do consumo de energia na sua casa</h1>
          <p className="register-info-description">
            Monitore o consumo em tempo real, estabeleça limites inteligentes e evite desperdícios com o gerenciador inteligente GreenEnergy.
          </p>
          
          <div className="register-benefits">
            <div className="benefit-item">
              <div className="benefit-icon">
                <Cpu size={20} />
              </div>
              <div>
                <h4 className="benefit-text-title">Controle dos Aparelhos</h4>
                <p className="benefit-text-desc">Monitore e gerencie o consumo individual de cada dispositivo eletrônico em tempo real.</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">
                <Target size={20} />
              </div>
              <div>
                <h4 className="benefit-text-title">Menos Consumo de Energia</h4>
                <p className="benefit-text-desc">Evite desperdícios e otimize a eficiência elétrica da sua residência com dados precisos.</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="benefit-text-title">Economia na Fatura</h4>
                <p className="benefit-text-desc">Defina metas mensais em R$ ou kWh e acompanhe previsões de gastos para poupar dinheiro.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="register-form-section">
        <div className="register-card-custom">
          <div className="auth-header" style={{ textAlign: 'left', marginBottom: '24px' }}>
            <h2 className="auth-title">Acessar Conta</h2>
            <p className="auth-subtitle">Entre com suas credenciais para acessar a plataforma</p>
          </div>

          {error && (
            <div className="toast toast-error auth-error-alert" style={{ position: 'relative', bottom: 0, right: 0, margin: '0 0 20px 0', minWidth: 'auto' }}>
              <span className="toast-message">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className={`form-input ${error && !email ? 'input-error' : ''}`}
                placeholder="seu-email@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                className={`form-input ${error && !senha ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button type="submit" className="btn-primary auth-button" style={{ marginTop: '16px' }} disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar na Conta'}
            </button>
          </form>

          <div className="auth-footer" style={{ textAlign: 'left', marginTop: '24px' }}>
            Não tem uma conta?
            <Link to="/cadastro" className="auth-link">
              Cadastre-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
