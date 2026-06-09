import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Plus, Edit3, Calendar, Power, AlertOctagon } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { formatNumber, formatCurrency } from '../../utils/format'

interface Meta {
  id: number
  dispositivoId: number
  dispositivoNome: string
  operadorId?: number
  operadorNome?: string
  tipoMeta: string // "KWh" ou "Financeira"
  valorLimite: number
  justificativa: string
  status: string // "Proposta", "Aprovada", "Devolvida"
  avaliacaoObs?: string
  dataInicio: string
  dataFim?: string | null
  desligarAoEstourar: boolean
  dispositivoDesligadoPorMeta: boolean
  isActive: boolean
}

export const Metas: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [metas, setMetas] = useState<Meta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [valorTarifa, setValorTarifa] = useState(0.65) // Fallback padrão

  // Deactivate modal state
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<number | null>(null)

  const fetchMetas = async () => {
    try {
      setIsLoading(true)
      
      // Busca tarifas ativas e dispositivos
      const [devicesRes, tarifasRes] = await Promise.allSettled([
        api.get('/dispositivos'),
        api.get('/tarifas')
      ])

      if (tarifasRes.status === 'fulfilled' && tarifasRes.value.data.success) {
        const active = (tarifasRes.value.data.data || []).find((t: any) => t.isActive)
        if (active) {
          setValorTarifa(active.valorKWh)
        }
      }

      if (devicesRes.status === 'rejected' || !devicesRes.value.data.success) {
        setMetas([])
        return
      }

      const devices = devicesRes.value.data.data || []
      if (devices.length === 0) {
        setMetas([])
        return
      }

      // Busca metas de cada dispositivo
      const promises = devices.map(async (d: any) => {
        try {
          const mRes = await api.get(`/metas/dispositivo/${d.id}`)
          if (mRes.data.success) {
            return mRes.data.data || []
          }
          return []
        } catch {
          return []
        }
      })

      const results = await Promise.all(promises)
      const allMetas: Meta[] = results.flat()
      
      // Ordena por ID decrescente
      allMetas.sort((a, b) => b.id - a.id)
      setMetas(allMetas)
    } catch (err) {
      console.error('Erro ao carregar metas:', err)
      addToast('Não foi possível carregar as metas de consumo.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetas()
  }, [])

  const translateTipo = (tipo: string) => {
    return tipo === 'KWh' ? 'Consumo (kWh)' : 'Financeiro (R$)'
  }

  const formatValor = (tipo: string, valor: number) => {
    if (tipo === 'KWh') {
      return `${valor.toLocaleString('pt-BR')} kWh`
    }
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'proposta':
        return 'Aguardando Avaliação'
      case 'aprovada':
        return 'Aprovada'
      case 'devolvida':
        return 'Devolvida'
      default:
        return status
    }
  }

  const handleFinalizar = async (id: number) => {
    try {
      const res = await api.post(`/metas/${id}/finalizar`)
      if (res.data.success) {
        addToast('Meta finalizada com sucesso! Consumo normalizado.', 'success')
        fetchMetas()
      } else {
        addToast(res.data.message || 'Erro ao finalizar a meta.', 'error')
      }
    } catch (err: any) {
      console.error(err)
      addToast(err.response?.data?.message || 'Falha ao finalizar meta.', 'error')
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
          <h1 className="dashboard-title">Minhas Metas de Consumo</h1>
          <p className="dashboard-subtitle">Defina limites mensais de consumo (kWh ou R$) para cada um de seus aparelhos e evite surpresas na conta de luz.</p>
        </div>
        
        {metas.length > 0 && (
          <button 
            className="btn-primary" 
            onClick={() => navigate('/cliente/metas/nova')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Nova Meta
          </button>
        )}
      </div>

      {metas.length === 0 ? (
        <EmptyState
          title="Nenhuma meta proposta"
          description="Você ainda não definiu nenhuma meta de consumo para seus dispositivos. Propor limites ajuda a monitorar os gastos e gera alertas inteligentes quando o consumo estiver próximo do limite planejado."
          actionText="Propor Primeira Meta"
          onAction={() => navigate('/cliente/metas/nova')}
          icon={<Target size={48} color="var(--green-700)" />}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {metas.map((m) => {
            const equivVal = m.tipoMeta === 'KWh' 
              ? formatCurrency(m.valorLimite * valorTarifa)
              : `${formatNumber(m.valorLimite / valorTarifa, 2)} kWh`;

            return (
              <div 
                key={m.id} 
                className="unit-card" 
                style={{ 
                  cursor: 'default', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  padding: '24px',
                  border: m.dispositivoDesligadoPorMeta ? '2px solid var(--red-500)' : undefined
                }}
              >
                <div>
                  <div className="unit-card-title-row" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                        Meta #{m.id}
                      </h3>
                      <span style={{ fontSize: '14px', color: 'var(--gray-500)', fontWeight: '500' }}>
                        ({translateTipo(m.tipoMeta)})
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <StatusBadge 
                        status={m.isActive ? m.status : 'Inativa'} 
                        label={m.isActive ? translateStatus(m.status) : 'Inativa/Finalizada'} 
                      />
                      
                      {m.isActive && (m.status === 'Proposta' || m.status === 'Devolvida') && (
                        <button 
                          onClick={() => navigate('/cliente/metas/nova', { state: { editingMeta: m } })} 
                          className="btn-secondary" 
                          style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                        >
                          <Edit3 size={12} />
                          Editar
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block', marginBottom: '4px' }}>Aparelho</span>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gray-900)' }}>{m.dispositivoNome}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block', marginBottom: '4px' }}>Limite Planejado</span>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--green-700)' }}>{formatValor(m.tipoMeta, m.valorLimite)}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block', marginBottom: '4px' }}>Equivalência Estimada</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-700)' }}>{equivVal}</span>
                    </div>
                  </div>

                  {/* Detalhes de Vigência e Auto Desligamento */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--white-soft)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block', marginBottom: '4px', alignContent: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> Período de Validade</span>
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-900)' }}>
                        {new Date(m.dataInicio).toLocaleDateString()} {m.dataFim ? `até ${new Date(m.dataFim).toLocaleDateString()}` : '(Tempo Indeterminado)'}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block', marginBottom: '4px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Power size={12} /> Comportamento no Limite</span>
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: m.desligarAoEstourar ? 'var(--red-600)' : 'var(--gray-600)' }}>
                        {m.desligarAoEstourar ? 'Desligar Aparelho' : 'Apenas Notificar'}
                      </span>
                    </div>
                  </div>

                  {m.dispositivoDesligadoPorMeta && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fee2e2',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      color: '#991b1b',
                      fontSize: '13.5px',
                      marginBottom: '16px'
                    }}>
                      <AlertOctagon size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Aparelho Suspenso por Consumo:</strong> O fornecimento de energia para o aparelho <strong>{m.dispositivoNome}</strong> foi suspenso automaticamente porque ele ultrapassou o limite estabelecido nesta meta.
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--gray-500)', backgroundColor: 'var(--white-soft)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                      <strong>Justificativa da Proposta:</strong>
                      <p style={{ margin: '4px 0 0 0', lineHeight: '1.4', fontStyle: 'italic' }}>"{m.justificativa}"</p>
                    </div>

                    {m.avaliacaoObs && (
                      <div style={{ 
                        fontSize: '13px', 
                        color: m.status === 'Aprovada' ? 'var(--green-950)' : '#7f1d1d', 
                        backgroundColor: m.status === 'Aprovada' ? 'var(--green-50)' : '#fff5f5', 
                        padding: '12px', 
                        borderRadius: 'var(--radius-md)',
                        borderLeft: `3px solid ${m.status === 'Aprovada' ? 'var(--green-500)' : 'var(--red-500)'}`
                      }}>
                        <strong>Observações do Operador ({m.operadorNome || 'Técnico'}):</strong>
                        <p style={{ margin: '4px 0 0 0', lineHeight: '1.4' }}>{m.avaliacaoObs}</p>
                      </div>
                    )}
                  </div>

                  {/* Barra de Ações Rápidas */}
                  {m.isActive && m.status === 'Aprovada' && (
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setConfirmDeactivateId(m.id)}
                        className="btn-danger"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px' }}
                      >
                        <Power size={13} />
                        Finalizar Meta e Normalizar Consumo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDeactivateId !== null}
        title="Finalizar Meta de Consumo"
        message="Tem certeza de que deseja finalizar esta meta? Caso o aparelho tenha sido desligado por ela, o fornecimento de energia/status dele será normalizado imediatamente."
        confirmText="Finalizar Meta"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          if (confirmDeactivateId !== null) {
            handleFinalizar(confirmDeactivateId)
            setConfirmDeactivateId(null)
          }
        }}
        onCancel={() => setConfirmDeactivateId(null)}
      />
    </div>
  )
}
