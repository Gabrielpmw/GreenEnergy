import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, RefreshCw, Eye } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import api from '../../services/api'

interface Relatorio {
  id: number
  chamadoId: number
  operadorNome: string
  conteudo: string
  tipoOcorrencia: string
  criadoEm: string
}

export const Relatorios: React.FC = () => {
  const navigate = useNavigate()
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState('')

  const fetchRelatorios = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/relatorios')
      if (res.data.success) {
        setRelatorios(res.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao buscar relatórios técnicos:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRelatorios()
  }, [])

  const translateOcorrencia = (tipo: string) => {
    switch (tipo) {
      case 'FalhaSensor':
        return 'Falha no Sensor'
      case 'ExcessoConsumo':
        return 'Excesso de Consumo'
      case 'ManutencaoRecomendada':
      case 'Manutencao':
        return 'Manutenção Preventiva'
      default:
        return tipo
    }
  }

  const getBadgeClass = (tipo: string) => {
    switch (tipo) {
      case 'FalhaSensor':
        return 'residencial' // red/pinkish in tokens
      case 'ExcessoConsumo':
        return 'comercial' // amber/orange in tokens
      default:
        return 'industrial' // green/blue in tokens
    }
  }

  const filtered = relatorios.filter(r => {
    if (filterType === '') return true
    return r.tipoOcorrencia.toLowerCase() === filterType.toLowerCase()
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
          <h1 className="dashboard-title">Laudos e Relatórios Técnicos</h1>
          <p className="dashboard-subtitle">Histórico de intervenções, manutenções, defeitos físicos e ocorrências emitidas em chamados.</p>
        </div>

        <button 
          className="btn-secondary" 
          onClick={fetchRelatorios}
          title="Atualizar lista"
          style={{ padding: '10px' }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filtro por tipo de ocorrência */}
      <div style={{
        display: 'flex',
        gap: '16px',
        backgroundColor: 'var(--white-card)',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--white-muted)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-500)' }}>Filtrar por Ocorrência</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--white-dim)',
              backgroundColor: 'var(--white-pure)',
              fontSize: '14px'
            }}
          >
            <option value="">Todas as Ocorrências</option>
            <option value="falhasensor">Falha no Sensor</option>
            <option value="excessoconsumo">Excesso de Consumo</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum laudo encontrado"
          description="Nenhuma ocorrência técnica foi registrada ou corresponde ao filtro no momento."
          icon={<FileText size={48} color="var(--green-700)" />}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((r) => (
            <div 
              key={r.id} 
              className="unit-card" 
              style={{ 
                cursor: 'default',
                display: 'flex', 
                flexDirection: 'column', 
                padding: '24px'
              }}
            >
              <div className="unit-card-title-row" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`unit-type-badge ${getBadgeClass(r.tipoOcorrencia)}`} style={{ textTransform: 'none' }}>
                    {translateOcorrencia(r.tipoOcorrencia)}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                    Laudo #{r.id} — Chamado #{r.chamadoId}
                  </span>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/operador/chamados/${r.chamadoId}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px' }}
                >
                  <Eye size={14} /> Ver Chamado
                </button>
              </div>

              <p style={{
                margin: '12px 0',
                fontSize: '14px',
                color: 'var(--gray-900)',
                lineHeight: '1.5',
                whiteSpace: 'pre-line'
              }}>
                {r.conteudo}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--white-muted)',
                paddingTop: '12px',
                fontSize: '12px',
                color: 'var(--gray-500)'
              }}>
                <span>Emitido por: <strong>{r.operadorNome}</strong></span>
                <span>{new Date(r.criadoEm).toLocaleDateString('pt-BR')} às {new Date(r.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
