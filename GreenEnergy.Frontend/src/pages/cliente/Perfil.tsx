import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../components/ui/Toast'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { Spinner } from '../../components/ui/Spinner'
import api from '../../services/api'

// Funções utilitárias de formatação
const formatPhone = (value: string) => {
  const nums = value.replace(/\D/g, '')
  if (nums.length <= 10) {
    return nums.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, g1, g2, g3) => {
      return `(${g1}) ${g2}${g3 ? '-' + g3 : ''}`
    })
  }
  return nums.substring(0, 11).replace(/(\d{2})(\d{5})(\d{0,4})/, (_, g1, g2, g3) => {
    return `(${g1}) ${g2}${g3 ? '-' + g3 : ''}`
  })
}

const formatDocument = (value: string) => {
  const nums = value.replace(/\D/g, '')
  if (nums.length <= 11) {
    return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, g1, g2, g3, g4) => {
      return `${g1}.${g2}.${g3}${g4 ? '-' + g4 : ''}`
    })
  }
  return nums.substring(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, g1, g2, g3, g4, g5) => {
    return `${g1}.${g2}.${g3}/${g4}${g5 ? '-' + g5 : ''}`
  })
}

export const Perfil: React.FC = () => {
  const { user, logout, login } = useAuthStore()
  const { addToast } = useToast()
  const navigate = useNavigate()

  // Estados dos dados
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [documento, setDocumento] = useState('')
  const [originalDocumento, setOriginalDocumento] = useState('')

  // Estados de senha
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('')

  // Estados de carregamento e modal
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const res = await api.get(`/usuarios/${user.id}`)
        if (res.data.success) {
          const u = res.data.data
          setNome(u.nome)
          setEmail(u.email)
          if (u.perfil) {
            setTelefone(formatPhone(u.perfil.telefone || ''))
            setDocumento(formatDocument(u.perfil.documento || ''))
            setOriginalDocumento(u.perfil.documento || '')
          }
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
        addToast('Erro ao carregar os dados do perfil.', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhone(e.target.value))
  }

  // Submissão do perfil básico
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!nome.trim() || !email.trim() || !telefone.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    // Se o usuário digitou algo no campo de senha, valida antes de abrir o modal
    if (novaSenha || confirmarNovaSenha) {
      if (novaSenha.length < 8) {
        setErrorMessage('A nova senha deve ter no mínimo 8 caracteres.')
        return
      }
      
      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      if (!pwdRegex.test(novaSenha)) {
        setErrorMessage('A senha deve conter ao menos 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.')
        return
      }

      if (novaSenha !== confirmarNovaSenha) {
        setErrorMessage('A confirmação de senha não confere.')
        return
      }

      // Abre o modal de confirmação para alteração de senha
      setIsConfirmModalOpen(true)
      return
    }

    // Fluxo comum (sem alteração de senha)
    await submitProfileChanges(null)
  }

  const submitProfileChanges = async (passwordValue: string | null) => {
    if (!user) return

    try {
      setIsSaving(true)
      
      const payload = {
        usuario: {
          nome,
          email,
          senha: passwordValue
        },
        perfil: {
          telefone: telefone.replace(/\D/g, ''),
          documento: originalDocumento,
          avatarUrl: null
        }
      }

      const res = await api.put(`/usuarios/${user.id}`, payload)

      if (res.data.success) {
        if (passwordValue) {
          // Se alterou a senha, faz o logout e redireciona
          addToast('Senha alterada com sucesso! Por favor, realize o login novamente.', 'success')
          logout()
          navigate('/login')
        } else {
          // Se foi alteração de dados básicos
          addToast('Perfil atualizado com sucesso!', 'success')
          // Atualiza as informações do usuário na store global para manter a consistência do Header/Sidebar
          login(useAuthStore.getState().token || '', useAuthStore.getState().refreshToken || '', {
            ...user,
            nome,
            email
          })
          // Limpa campos de senha por precaução
          setNovaSenha('')
          setConfirmarNovaSenha('')
        }
      } else {
        setErrorMessage(res.data.message || 'Erro ao atualizar dados.')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.response?.data?.message || 'Erro na comunicação com o servidor.')
    } finally {
      setIsSaving(false)
      setIsConfirmModalOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header" style={{ maxWidth: '650px', margin: '0 auto 32px auto' }}>
        <h1 className="dashboard-title">Meu Perfil</h1>
        <p className="dashboard-subtitle">Gerencie suas informações pessoais e credenciais de acesso.</p>
      </header>

      <div className="profile-card">
        {errorMessage && (
          <div className="toast toast-error" style={{ position: 'relative', margin: '0 0 24px 0', right: 0, bottom: 0, minWidth: 'auto' }}>
            <span className="toast-message">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <h3 className="profile-section-title">Dados Pessoais</h3>
          
          <div className="form-group">
            <label className="form-label" htmlFor="nome">Nome Completo</label>
            <input
              id="nome"
              type="text"
              className="form-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isSaving}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSaving}
              required
            />
          </div>

          <div className="profile-row">
            <div className="form-group">
              <label className="form-label" htmlFor="telefone">Telefone</label>
              <input
                id="telefone"
                type="text"
                className="form-input"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={handlePhoneChange}
                disabled={isSaving}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">CPF / CNPJ</label>
              <input
                type="text"
                className="form-input"
                value={documento}
                disabled
                style={{ backgroundColor: 'var(--white-muted)', color: 'var(--gray-500)', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <h3 className="profile-section-title" style={{ marginTop: '40px' }}>Alteração de Senha</h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)', marginBottom: '20px' }}>
            Preencha os campos abaixo apenas se desejar trocar a senha atual da sua conta.
          </p>

          <div className="profile-row">
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">Nova Senha</label>
              <input
                id="new-password"
                type="password"
                className="form-input"
                placeholder="Mínimo 8 caracteres"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Confirmar Nova Senha</label>
              <input
                id="confirm-password"
                type="password"
                className="form-input"
                placeholder="Repita a nova senha"
                value={confirmarNovaSenha}
                onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '24px' }}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando Alterações...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Confirmar Troca de Senha"
        message="Atenção! Ao alterar a sua senha de acesso, a sua sessão atual será encerrada no servidor e você precisará fazer o login novamente com as suas novas credenciais. Deseja prosseguir?"
        confirmText="Sim, Alterar e Sair"
        cancelText="Cancelar"
        onConfirm={() => submitProfileChanges(novaSenha)}
        onCancel={() => setIsConfirmModalOpen(false)}
        isDestructive={false}
      />
    </div>
  )
}
