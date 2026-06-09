import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Search, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

interface Usuario {
  id: number
  nome: string
  email: string
  role: string
  isActive: boolean
  criadoEm: string
  documento?: string
  telefone?: string
}

type TabType = 'todos' | 'clientes' | 'operadores'

export const Usuarios: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('todos')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Estados do Modal de Confirmação
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)

  const fetchUsuarios = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      else setIsRefreshing(true)

      let endpoint = '/usuarios'
      if (activeTab === 'clientes') endpoint = '/usuarios/clientes'
      if (activeTab === 'operadores') endpoint = '/usuarios/operadores'

      const res = await api.get(endpoint)
      if (res.data.success) {
        setUsuarios(res.data.data || [])
      } else {
        addToast(res.data.message || 'Erro ao carregar usuários.', 'error')
      }
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err)
      addToast('Erro ao carregar lista de usuários.', 'error')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [activeTab])

  const handleToggleStatusClick = (user: Usuario) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleConfirmToggleStatus = async () => {
    if (!selectedUser) return

    const { id, isActive, nome } = selectedUser
    const action = isActive ? 'desativar' : 'ativar'
    try {
      const res = await api.patch(`/usuarios/${id}/${action}`)
      if (res.data.success) {
        addToast(`Usuário ${nome} foi ${isActive ? 'desativado' : 'ativado'} com sucesso!`, 'success')
        
        // Atualiza a lista localmente
        setUsuarios((prev) =>
          prev.map((u) => (u.id === id ? { ...u, isActive: !isActive } : u))
        )
      } else {
        addToast(res.data.message || `Erro ao ${action} usuário.`, 'error')
      }
    } catch (err: any) {
      console.error(`Erro ao patch status do usuario ${id}:`, err)
      const errorMsg = err.response?.data?.message || `Erro ao ${action} o usuário.`
      addToast(errorMsg, 'error')
    } finally {
      setIsModalOpen(false)
      setSelectedUser(null)
    }
  }

  // Filtrar usuários localmente com base no termo de pesquisa
  const filteredUsuarios = usuarios.filter((u) => {
    const term = searchTerm.toLowerCase()
    return (
      u.nome.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.documento && u.documento.includes(term))
    )
  })

  // Classe CSS do badge de Role customizada
  const getRoleBadgeStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return { backgroundColor: '#f3e8ff', color: '#6b21a8' } // Roxo
      case 'operador':
        return { backgroundColor: '#dbeafe', color: '#1e40af' } // Azul
      case 'cliente':
        return { backgroundColor: '#dcfce7', color: '#166534' } // Verde
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' }
    }
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="units-header-actions" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="dashboard-title">Gestão de Usuários</h1>
          <p className="dashboard-subtitle">Ativação, desativação de clientes e cadastro de novos técnicos operacionais.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={() => fetchUsuarios(true)}
            disabled={isRefreshing}
            title="Atualizar lista"
            style={{ padding: '10px' }}
          >
            {isRefreshing ? <Spinner size="sm" /> : <RefreshCw size={16} />}
          </button>
          
          <button
            className="btn-primary"
            onClick={() => navigate('/admin/usuarios/operadores/novo')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <UserPlus size={16} />
            Cadastrar Operador
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--white-muted)',
        marginBottom: '24px',
        gap: '24px'
      }}>
        {(['todos', 'clientes', 'operadores'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setSearchTerm('')
            }}
            style={{
              padding: '12px 4px',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '500',
              color: activeTab === tab ? 'var(--green-700)' : 'var(--gray-500)',
              borderBottom: activeTab === tab ? '2px solid var(--green-700)' : '2px solid transparent',
              backgroundColor: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all var(--transition-fast)'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div style={{
        position: 'relative',
        marginBottom: '24px',
        maxWidth: '400px'
      }}>
        <Search 
          size={18} 
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--gray-500)'
          }} 
        />
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 12px 10px 40px',
            width: '100%',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--white-dim)',
            backgroundColor: 'var(--white-pure)',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      {/* Tabela de Usuários */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Spinner size="lg" />
        </div>
      ) : filteredUsuarios.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: 'var(--white-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--white-muted)',
          color: 'var(--gray-500)'
        }}>
          Nenhum usuário encontrado para a busca especificada.
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--white-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--white-muted)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--white-soft)', borderBottom: '1px solid var(--white-muted)', color: 'var(--gray-500)', fontWeight: '600' }}>
                <th style={{ padding: '16px' }}>Usuário</th>
                <th style={{ padding: '16px' }}>Contato & Doc</th>
                <th style={{ padding: '16px' }}>Perfil / Role</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px' }}>Criado Em</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--white-muted)', backgroundColor: user.isActive ? 'transparent' : '#fdfafb' }}>
                  {/* Nome e E-mail */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{user.nome}</div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{user.email}</div>
                  </td>

                  {/* Telefone e Documento */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ color: 'var(--gray-900)' }}>{user.documento || '—'}</div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{user.telefone || '—'}</div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: '16px' }}>
                    <span 
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: 'var(--radius-full)',
                        ...getRoleBadgeStyle(user.role)
                      }}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '16px' }}>
                    <StatusBadge status={user.isActive ? 'ativo' : 'desativada'} label={user.isActive ? 'Ativo' : 'Inativo'} />
                  </td>

                  {/* Data de Cadastro */}
                  <td style={{ padding: '16px', color: 'var(--gray-500)' }}>
                    {new Date(user.criadoEm).toLocaleDateString('pt-BR')}
                  </td>

                  {/* Ações */}
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {user.role.toLowerCase() !== 'admin' && (
                      <button
                        onClick={() => handleToggleStatusClick(user)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: 'var(--radius-md)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: user.isActive ? 'var(--red-500)' : 'var(--green-700)',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'background-color var(--transition-fast)'
                        }}
                        title={user.isActive ? 'Desativar usuário' : 'Ativar usuário'}
                        className="btn-status-toggle"
                      >
                        {user.isActive ? (
                          <>
                            <ToggleRight size={24} />
                            Desativar
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={24} />
                            Ativar
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ConfirmModal para alteração de status */}
      <ConfirmModal
        isOpen={isModalOpen}
        title={selectedUser?.isActive ? 'Confirmar Desativação' : 'Confirmar Reativação'}
        message={`Deseja realmente ${selectedUser?.isActive ? 'desativar (soft delete)' : 'reativar'} a conta de ${selectedUser?.nome}?`}
        confirmText={selectedUser?.isActive ? 'Desativar' : 'Ativar'}
        cancelText="Cancelar"
        isDestructive={selectedUser?.isActive}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => {
          setIsModalOpen(false)
          setSelectedUser(null)
        }}
      />
    </div>
  )
}
