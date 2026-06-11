import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, RefreshCw, Calendar, Eye } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import api from '../../services/api'

interface Chamado {
  id: number
  clienteId: number
  clienteNome: string
  operadorId?: number
  operadorNome?: string
  dispositivoId: number
  dispositivoNome: string
  tipo: string
  status: string
  descricao: string
  criadoEm: string
}

export const Chamados: React.FC = () => {
  const navigate = useNavigate()
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')

  const fetchChamados = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/chamados')
      if (res.data.success) {
        setChamados(res.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao buscar fila de chamados:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChamados()
  }, [])

  const translateTipo = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'instalacao':
        return 'Instalação'
      case 'remocao':
        return 'Remoção'
      case 'manutencao':
        return 'Manutenção'
      default:
        return tipo
    }
  }

  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente':
        return 'Pendente'
      case 'emanalise':
        return 'Em Análise'
      case 'validado':
        return 'Finalizado'
      default:
        return status
    }
  }

  const filteredChamados = chamados.filter((c) => {
    const matchesStatus = statusFilter === '' || c.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesTipo = tipoFilter === '' || c.tipo.toLowerCase() === tipoFilter.toLowerCase()
    return matchesStatus && matchesTipo
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="units-header-actions" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="dashboard-title">Fila de Chamados Técnicos</h1>
          <p className="dashboard-subtitle">Triagem, instalação de sensores e manutenção corretiva de aparelhos no sistema.</p>
        </div>
        
        <button 
          className="btn-secondary" 
          onClick={fetchChamados}
          title="Atualizar lista"
          style={{ padding: '10px' }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filtros */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        backgroundColor: 'var(--white-card)',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--white-muted)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-500)' }}>Filtrar por Status</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--white-dim)',
              backgroundColor: 'var(--white-pure)',
              fontSize: '14px'
            }}
          >
            <option value="">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="emanalise">Em Análise</option>
            <option value="validado">Finalizado / Validado</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-500)' }}>Filtrar por Tipo</label>
          <select 
            value={tipoFilter} 
            onChange={(e) => setTipoFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--white-dim)',
              backgroundColor: 'var(--white-pure)',
              fontSize: '14px'
            }}
          >
            <option value="">Todos os Tipos</option>
            <option value="instalacao">Instalação</option>
            <option value="remocao">Remoção</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </div>
      </div>

      {filteredChamados.length === 0 ? (
        <EmptyState
          title="Nenhum chamado encontrado"
          description="Nenhuma solicitação de suporte técnico corresponde aos critérios de filtragem selecionados no momento."
          actionText="Limpar Filtros"
          onAction={() => {
            setStatusFilter('')
            setTipoFilter('')
          }}
          icon={<Wrench size={48} color="var(--green-700)" />}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredChamados.map((c) => (
            <div 
              key={c.id} 
              className="unit-card" 
              onClick={() => navigate(`/operador/chamados/${c.id}`)}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                padding: '24px'
              }}
            >
              <div>
                <div className="unit-card-title-row" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                      Chamado #{c.id}
                    </h3>
                    <span className="unit-type-badge residencial" style={{ textTransform: 'none' }}>
                      {translateTipo(c.tipo)}
                    </span>
                  </div>
                  <StatusBadge status={c.status} label={translateStatus(c.status)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px', fontSize: '14px' }}>
                  <div>
                    <span style={{ color: 'var(--gray-500)' }}>Cliente:</span>{' '}
                    <strong style={{ color: 'var(--gray-900)' }}>{c.clienteNome}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-500)' }}>Aparelho:</span>{' '}
                    <strong style={{ color: 'var(--gray-900)' }}>{c.dispositivoNome}</strong>
                  </div>
                  {c.operadorNome && (
                    <div>
                      <span style={{ color: 'var(--gray-500)' }}>Atendido por:</span>{' '}
                      <strong style={{ color: 'var(--green-900)' }}>{c.operadorNome}</strong>
                    </div>
                  )}
                </div>

                <p style={{
                  fontSize: '13.5px',
                  color: 'var(--gray-500)',
                  backgroundColor: 'var(--white-soft)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  margin: '0 0 16px 0',
                  lineHeight: '1.4',
                  borderLeft: '3px solid var(--green-700)'
                }}>
                  {c.descricao}
                </p>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                paddingTop: '16px', 
                borderTop: '1px solid var(--white-muted)',
                fontSize: '13px',
                color: 'var(--gray-500)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} />
                  <span>Aberto em: {new Date(c.criadoEm).toLocaleDateString('pt-BR')} às {new Date(c.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--green-700)', fontWeight: '600' }}>
                  <span>Ver Detalhe</span>
                  <Eye size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
