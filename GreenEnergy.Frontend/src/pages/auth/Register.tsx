import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { Leaf, Cpu, Target, ShieldCheck } from 'lucide-react'

export const Register: React.FC = () => {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [telefone, setTelefone] = useState('')
  const [documento, setDocumento] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { addToast } = useToast()

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cleanValue = value.replace(/\D/g, '').slice(0, 11)
    
    let masked = cleanValue
    if (cleanValue.length > 0) {
      const areaCode = cleanValue.slice(0, 2)
      if (cleanValue.length <= 2) {
        masked = `(${areaCode}`
      } else if (cleanValue.length <= 6) {
        masked = `(${areaCode}) ${cleanValue.slice(2)}`
      } else {
        const isNineDigits = cleanValue.length === 11
        const slicePoint = isNineDigits ? 7 : 6
        masked = `(${areaCode}) ${cleanValue.slice(2, slicePoint)}-${cleanValue.slice(slicePoint)}`
      }
    }
    setTelefone(masked)
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cleanValue = value.replace(/\D/g, '').slice(0, 14)
    
    let masked = cleanValue
    if (cleanValue.length > 0) {
      if (cleanValue.length <= 11) {
        const p1 = cleanValue.slice(0, 3)
        const p2 = cleanValue.slice(3, 6)
        const p3 = cleanValue.slice(6, 9)
        const p4 = cleanValue.slice(9, 11)
        
        if (cleanValue.length <= 3) {
          masked = p1
        } else if (cleanValue.length <= 6) {
          masked = `${p1}.${p2}`
        } else if (cleanValue.length <= 9) {
          masked = `${p1}.${p2}.${p3}`
        } else {
          masked = `${p1}.${p2}.${p3}-${p4}`
        }
      } else {
        const p1 = cleanValue.slice(0, 2)
        const p2 = cleanValue.slice(2, 5)
        const p3 = cleanValue.slice(5, 8)
        const p4 = cleanValue.slice(8, 12)
        const p5 = cleanValue.slice(12, 14)
        
        if (cleanValue.length <= 2) {
          masked = p1
        } else if (cleanValue.length <= 5) {
          masked = `${p1}.${p2}`
        } else if (cleanValue.length <= 8) {
          masked = `${p1}.${p2}.${p3}`
        } else if (cleanValue.length <= 12) {
          masked = `${p1}.${p2}.${p3}/${p4}`
        } else {
          masked = `${p1}.${p2}.${p3}/${p4}-${p5}`
        }
      }
    }
    setDocumento(masked)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (nome.trim().length < 3) {
      setError('O nome deve conter pelo menos 3 caracteres.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Por favor, informe um e-mail válido.')
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(senha)) {
      setError('A senha deve ter pelo menos 8 caracteres, com uma letra maiúscula, uma minúscula, um número e um caractere especial.')
      return
    }

    const cleanPhone = telefone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setError('O telefone deve conter pelo menos DDD e 8 ou 9 dígitos.')
      return
    }

    const cleanDoc = documento.replace(/\D/g, '')
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      setError('O documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.')
      return
    }

    setIsLoading(true)

    try {
      const response = await api.post('/auth/register', {
        nome,
        email,
        senha,
        telefone,
        documento,
      })

      const apiResponse = response.data

      if (apiResponse.success) {
        addToast('Cadastro realizado com sucesso! Faça login.', 'success')
        navigate('/login')
      } else {
        setError(apiResponse.message || 'Erro ao realizar o cadastro.')
      }
    } catch (err: any) {
      console.error(err)
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        'Não foi possível conectar ao servidor. Tente novamente.'
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
            <h2 className="auth-title">Criar Conta</h2>
            <p className="auth-subtitle">Preencha o formulário abaixo para começar</p>
          </div>

          {error && (
            <div className="toast toast-error auth-error-alert" style={{ position: 'relative', bottom: 0, right: 0, margin: '0 0 20px 0', minWidth: 'auto' }}>
              <span className="toast-message">{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="nome">
                Nome Completo
              </label>
              <input
                id="nome"
                type="text"
                className="form-input"
                placeholder="Ex: João da Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="seu-email@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="telefone">
                Telefone
              </label>
              <input
                id="telefone"
                type="tel"
                className="form-input"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={handlePhoneChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="documento">
                CPF ou CNPJ
              </label>
              <input
                id="documento"
                type="text"
                className="form-input"
                placeholder="000.000.000-00"
                value={documento}
                onChange={handleDocumentChange}
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
                className="form-input"
                placeholder="Mínimo 8 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button type="submit" className="btn-primary auth-button" style={{ marginTop: '16px' }} disabled={isLoading}>
              {isLoading ? 'Cadastrando...' : 'Criar minha Conta'}
            </button>
          </form>

          <div className="auth-footer" style={{ textAlign: 'left', marginTop: '24px' }}>
            Já tem uma conta?
            <Link to="/login" className="auth-link">
              Conectar-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
