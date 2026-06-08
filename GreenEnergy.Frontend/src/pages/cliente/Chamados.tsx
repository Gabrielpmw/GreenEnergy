import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, Plus, Calendar } from 'lucide-react'
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

  useEffect(() => {
    const fetchChamados = async () => {
      try {
        setIsLoading(true)
        const res = await api.get('/chamados')
        if (res.data.success) {
          setChamados(res.data.data || [])
        }
      } catch (err) {
        console.error('Erro ao buscar chamados:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChamados()
  }, [])

  const translateTipo = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'instalacao':
        return 'Instalação de Sensor'
      case 'remocao':
        return 'Remoção de Dispositivo'
      case 'manutencao':
        return 'Manutenção Técnica'
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="units-header-actions">
        <div>
          <h1 className="dashboard-title">Meus Chamados</h1>
          <p className="dashboard-subtitle">Acompanhe as solicitações de instalação, remoção ou manutenção dos seus sensores e aparelhos.</p>
        </div>
        
        {chamados.length > 0 && (
          <button 
            className="btn-primary" 
            onClick={() => navigate('/cliente/chamados/novo')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Novo Chamado
          </button>
        )}
      </div>

      {chamados.length === 0 ? (
        <EmptyState
          title="Nenhum chamado aberto"
          description="Você ainda não possui nenhum chamado técnico aberto. Se precisar instalar um sensor em um novo aparelho, realizar manutenção ou remover um dispositivo, abra uma solicitação."
          actionText="Abrir Novo Chamado"
          onAction={() => navigate('/cliente/chamados/novo')}
          icon={<Wrench size={48} color="var(--green-700)" />}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {chamados.map((c) => (
            <div 
              key={c.id} 
              className="unit-card" 
              style={{ 
                cursor: 'default', 
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
                    <span style={{ fontSize: '14px', color: 'var(--gray-500)', fontWeight: '500' }}>
                      ({translateTipo(c.tipo)})
                    </span>
                  </div>
                  <StatusBadge status={c.status} label={translateStatus(c.status)} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--gray-900)' }}>
                    <strong>Aparelho Associado:</strong> {c.dispositivoNome}
                  </div>
                  
                  <div style={{ fontSize: '14px', color: 'var(--gray-500)', backgroundColor: 'var(--white-soft)', padding: '12px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--green-700)' }}>
                    <strong>Descrição do Chamado:</strong>
                    <p style={{ margin: '6px 0 0 0', lineHeight: '1.4' }}>{c.descricao}</p>
                  </div>
                </div>
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

                {c.operadorNome && (
                  <div style={{ fontWeight: '500', color: 'var(--green-900)' }}>
                    Atendido por: {c.operadorNome}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
