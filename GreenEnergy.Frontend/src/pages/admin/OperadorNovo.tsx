import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

export const OperadorNovo: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [telefone, setTelefone] = useState('')
  const [documento, setDocumento] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Regex de Validação
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/
  const docRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$|^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/
  // Mínimo 8 caracteres, pelo menos uma maiúscula, uma minúscula, um número e um caractere especial
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

  const validate = () => {
    const errors: Record<string, string> = {}

    if (nome.trim().length < 3) {
      errors.nome = 'O nome deve ter no mínimo 3 caracteres.'
    }
    if (!emailRegex.test(email)) {
      errors.email = 'Informe um e-mail válido.'
    }
    if (!passwordRegex.test(senha)) {
      errors.senha = 'A senha deve conter ao menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.'
    }
    if (!phoneRegex.test(telefone)) {
      errors.telefone = 'Informe um telefone no formato válido (ex: (11) 99999-9999 ou 11999999999).'
    }
    if (!docRegex.test(documento)) {
      errors.documento = 'Informe um CPF ou CNPJ válido.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      setIsSubmitting(true)
      const res = await api.post('/usuarios/operadores', {
        nome,
        email,
        senha,
        telefone,
        documento
      })

      if (res.data.success) {
        addToast(`Operador ${nome} cadastrado com sucesso!`, 'success')
        navigate('/admin/usuarios')
      } else {
        addToast(res.data.message || 'Erro ao cadastrar operador.', 'error')
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar operador:', err)
      const errorMsg = err.response?.data?.message || 'Falha ao cadastrar operador no servidor.'
      addToast(errorMsg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="dashboard-container">
      {/* Botão de Voltar */}
      <button
        onClick={() => navigate('/admin/usuarios')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'var(--green-700)',
          fontWeight: '600',
          cursor: 'pointer',
          padding: '0',
          marginBottom: '24px',
          fontSize: '14px'
        }}
      >
        <ArrowLeft size={16} />
        Voltar para Usuários
      </button>

      {/* Título */}
      <div style={{ marginBottom: '32px' }}>
        <h1 className="dashboard-title">Novo Operador</h1>
        <p className="dashboard-subtitle">Cadastre um novo técnico operador no sistema para gerenciamento de chamados e perícias.</p>
      </div>

      {/* Card do Formulário */}
      <div className="form-card" style={{ maxWidth: '600px', margin: '0' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Nome */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--gray-900)' }}>
              Nome Completo *
            </label>
            <input
              type="text"
              placeholder="Digite o nome completo do operador"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isSubmitting}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${validationErrors.nome ? 'var(--red-500)' : 'var(--white-dim)'}`,
                backgroundColor: 'var(--white-pure)',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            {validationErrors.nome && (
              <span style={{ fontSize: '12px', color: 'var(--red-500)' }}>{validationErrors.nome}</span>
            )}
          </div>

          {/* E-mail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--gray-900)' }}>
              Endereço de E-mail *
            </label>
            <input
              type="email"
              placeholder="exemplo@greenenergy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${validationErrors.email ? 'var(--red-500)' : 'var(--white-dim)'}`,
                backgroundColor: 'var(--white-pure)',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            {validationErrors.email && (
              <span style={{ fontSize: '12px', color: 'var(--red-500)' }}>{validationErrors.email}</span>
            )}
          </div>

          {/* Senha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--gray-900)' }}>
              Senha de Acesso *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres com símbolos"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={isSubmitting}
                style={{
                  padding: '10px 40px 10px 12px',
                  width: '100%',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${validationErrors.senha ? 'var(--red-500)' : 'var(--white-dim)'}`,
                  backgroundColor: 'var(--white-pure)',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {validationErrors.senha && (
              <span style={{ fontSize: '12px', color: 'var(--red-500)', lineHeight: '1.4' }}>
                {validationErrors.senha}
              </span>
            )}
          </div>

          {/* Grid Telefone & Documento */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
          }}>
            {/* Telefone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--gray-900)' }}>
                Telefone *
              </label>
              <input
                type="text"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                disabled={isSubmitting}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${validationErrors.telefone ? 'var(--red-500)' : 'var(--white-dim)'}`,
                  backgroundColor: 'var(--white-pure)',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
              {validationErrors.telefone && (
                <span style={{ fontSize: '12px', color: 'var(--red-500)' }}>{validationErrors.telefone}</span>
              )}
            </div>

            {/* Documento */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--gray-900)' }}>
                CPF ou CNPJ *
              </label>
              <input
                type="text"
                placeholder="Somente números ou com pontuação"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                disabled={isSubmitting}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${validationErrors.documento ? 'var(--red-500)' : 'var(--white-dim)'}`,
                  backgroundColor: 'var(--white-pure)',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
              {validationErrors.documento && (
                <span style={{ fontSize: '12px', color: 'var(--red-500)' }}>{validationErrors.documento}</span>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{
              marginTop: '12px',
              padding: '12px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isSubmitting ? (
              <Spinner size="sm" />
            ) : (
              <>
                <UserPlus size={18} />
                Cadastrar Operador Técnico
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
