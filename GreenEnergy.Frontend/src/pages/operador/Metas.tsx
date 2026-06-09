import React, { useEffect, useState } from 'react'
import { Target, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { formatNumber, formatCurrency } from '../../utils/format'

interface Meta {
  id: number
  dispositivoId: number
  dispositivoNome: string
  operadorId?: number
  operadorNome?: string
  tipoMeta: string
  valorLimite: number
  justificativa: string
  status: string
  avaliacaoObs?: string
}

export const Metas: React.FC = () => {
  const { addToast } = useToast()

  const [metas, setMetas] = useState<Meta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Controle de Modal de Avaliação
  const [selectedMeta, setSelectedMeta] = useState<Meta | null>(null)
  const [newStatus, setNewStatus] = useState<number | null>(null) // 1 = Aprovada, 2 = Devolvida
  const [obsText, setObsText] = useState('')
  const [evalLoading, setEvalLoading] = useState(false)

  const fetchMetas = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/metas')
      if (res.data.success) {
        setMetas(res.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao buscar propostas de metas:', err)
      addToast('Erro ao carregar metas.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetas()
  }, [])

  const handleOpenEvaluation = (meta: Meta, statusVal: number) => {
    setSelectedMeta(meta)
    setNewStatus(statusVal)
    setObsText('')
  }

  const handleCloseEvaluation = () => {
    setSelectedMeta(null)
    setNewStatus(null)
    setObsText('')
  }

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMeta || newStatus === null) return

    if (obsText.trim().length < 5 || obsText.trim().length > 250) {
      addToast('As observações da avaliação devem ter entre 5 e 250 caracteres.', 'warning')
      return
    }

    try {
      setEvalLoading(true)
      const res = await api.patch(`/metas/${selectedMeta.id}/avaliar`, {
        status: newStatus,
        avaliacaoObs: obsText.trim()
      })

      if (res.data.success) {
        addToast(
          `Meta de consumo ${newStatus === 1 ? 'APROVADA' : 'DEVOLVIDA'} com sucesso!`,
          'success'
        )
        // Atualiza o estado local imediatamente
        setMetas((prev) => 
          prev.map((m) => (m.id === selectedMeta.id ? { ...m, status: res.data.data.status, avaliacaoObs: res.data.data.avaliacaoObs, operadorNome: res.data.data.operadorNome } : m))
        )
        handleCloseEvaluation()
      } else {
        addToast(res.data.message || 'Erro ao avaliar meta.', 'error')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao processar avaliação técnica da meta.'
      addToast(msg, 'error')
    } finally {
      setEvalLoading(false)
    }
  }

  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'proposta':
        return 'Aguardando Avaliação'
      case 'aprovada':
        return 'Aprovada'
      case 'devolvida':
        return 'Devolvida ao Cliente'
      default:
        return status
    }
  }

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
          <h1 className="dashboard-title">Avaliar Metas de Consumo</h1>
          <p className="dashboard-subtitle">Audite e aprove limites de consumo de kWh ou financeiros sugeridos pelos clientes.</p>
        </div>

        <button 
          className="btn-secondary" 
          onClick={fetchMetas}
          title="Atualizar lista"
          style={{ padding: '10px' }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {metas.length === 0 ? (
        <EmptyState
          title="Nenhuma meta proposta"
          description="Nenhum cliente submeteu propostas de metas de consumo para avaliação no momento."
          icon={<Target size={48} color="var(--green-700)" />}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {metas.map((m) => {
            const isProposta = m.status.toLowerCase() === 'proposta'
            return (
              <div 
                key={m.id} 
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
                        Meta #{m.id}
                      </h3>
                      <span className="unit-type-badge comercial" style={{ textTransform: 'none' }}>
                        Dispositivo: {m.dispositivoNome}
                      </span>
                    </div>
                    <StatusBadge status={m.status} label={translateStatus(m.status)} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: 'var(--gray-500)' }}>Limite Solicitado:</span>{' '}
                      <strong style={{ color: 'var(--gray-900)' }}>
                        {m.tipoMeta === 'KWh' ? `${formatNumber(m.valorLimite, 2)} kWh` : formatCurrency(m.valorLimite)}
                      </strong>
                    </div>

                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: 'var(--white-soft)', 
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13.5px',
                      borderLeft: '3px solid var(--green-700)',
                      lineHeight: '1.4'
                    }}>
                      <strong style={{ color: 'var(--gray-900)' }}>Justificativa do Cliente:</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--gray-500)' }}>{m.justificativa}</p>
                    </div>

                    {m.avaliacaoObs && (
                      <div style={{ 
                        padding: '12px', 
                        backgroundColor: '#fffafb', 
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        borderLeft: `3px solid ${m.status.toLowerCase() === 'aprovada' ? 'var(--green-500)' : 'var(--red-500)'}`,
                        lineHeight: '1.4'
                      }}>
                        <strong style={{ color: 'var(--gray-900)' }}>Parecer do Operador:</strong>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--gray-500)' }}>{m.avaliacaoObs}</p>
                        {m.operadorNome && (
                          <span style={{ fontSize: '11px', color: 'var(--gray-400)', display: 'block', marginTop: '6px' }}>
                            Avaliado por: {m.operadorNome}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isProposta && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: '12px', 
                    paddingTop: '16px',
                    borderTop: '1px solid var(--white-muted)'
                  }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleOpenEvaluation(m, 2)}
                      style={{ color: 'var(--red-500)', borderColor: '#fee2e2', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <XCircle size={14} /> Devolver
                    </button>

                    <button
                      className="btn-primary"
                      onClick={() => handleOpenEvaluation(m, 1)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CheckCircle2 size={14} /> Aprovar Meta
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal / Overlay para preenchimento de observações de avaliação */}
      {selectedMeta && newStatus !== null && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <h3 className="modal-title">
              {newStatus === 1 ? 'Aprovar Meta de Consumo' : 'Devolver Meta para Ajuste'}
            </h3>
            
            <form onSubmit={handleSaveEvaluation}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: 'var(--gray-500)', margin: 0 }}>
                  Preencha as observações técnicas que fundamentam a sua decisão de {newStatus === 1 ? 'aprovação' : 'devolução'} da meta.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)' }}>
                    Observações de Avaliação * (5 a 250 caracteres)
                  </label>
                  <textarea
                    rows={4}
                    value={obsText}
                    onChange={(e) => setObsText(e.target.value)}
                    required
                    disabled={evalLoading}
                    placeholder="Ex: Valor compatível com o perfil histórico do aparelho e área do imóvel..."
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-dim)',
                      backgroundColor: 'var(--white-pure)',
                      fontSize: '13px',
                      resize: 'vertical'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: obsText.length < 5 || obsText.length > 250 ? 'var(--red-500)' : 'var(--green-700)' }}>
                    Caracteres: {obsText.length} / 250
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleCloseEvaluation}
                  disabled={evalLoading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={newStatus === 2 ? 'btn-danger' : 'btn-primary'}
                  disabled={evalLoading || obsText.length < 5 || obsText.length > 250}
                >
                  {evalLoading ? <Spinner size="sm" color="white" /> : 'Confirmar Avaliação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
