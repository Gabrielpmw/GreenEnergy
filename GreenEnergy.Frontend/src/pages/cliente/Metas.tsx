import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Plus, Edit3, X, Save, Calendar, Power, AlertOctagon } from 'lucide-react'
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

  // Edit Modal State
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null)
  const [editTipo, setEditTipo] = useState('0') // 0 = kWh, 1 = Financeira
  const [editValor, setEditValor] = useState('')
  const [editJustificativa, setEditJustificativa] = useState('')
  const [editDataInicio, setEditDataInicio] = useState('')
  const [editTempoIndeterminado, setEditTempoIndeterminado] = useState(true)
  const [editDataFim, setEditDataFim] = useState('')
  const [editDesligarAoEstourar, setEditDesligarAoEstourar] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

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

  const handleOpenEdit = (meta: Meta) => {
    setEditingMeta(meta)
    setEditTipo(meta.tipoMeta === 'KWh' ? '0' : '1')
    setEditValor(meta.valorLimite.toString())
    setEditJustificativa(meta.justificativa)
    setEditDataInicio(meta.dataInicio ? meta.dataInicio.substring(0, 10) : new Date().toISOString().substring(0, 10))
    setEditTempoIndeterminado(!meta.dataFim)
    setEditDataFim(meta.dataFim ? meta.dataFim.substring(0, 10) : '')
    setEditDesligarAoEstourar(meta.desligarAoEstourar)
    setEditError(null)
  }

  const handleCloseEdit = () => {
    setEditingMeta(null)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)

    if (!editingMeta) return

    const val = parseFloat(editValor)
    if (isNaN(val) || val <= 0.01) {
      setEditError('O valor limite deve ser maior que zero.')
      return
    }

    if (editJustificativa.trim().length < 5 || editJustificativa.trim().length > 250) {
      setEditError('A justificativa deve ter entre 5 e 250 caracteres.')
      return
    }

    if (!editTempoIndeterminado && !editDataFim) {
      setEditError('Selecione uma data de término.')
      return
    }

    try {
      setIsSavingEdit(true)
      const payload = {
        tipoMeta: parseInt(editTipo, 10),
        valorLimite: val,
        justificativa: editJustificativa.trim(),
        dataInicio: new Date(editDataInicio).toISOString(),
        dataFim: editTempoIndeterminado ? null : new Date(editDataFim).toISOString(),
        desligarAoEstourar: editDesligarAoEstourar
      }

      const res = await api.put(`/metas/${editingMeta.id}`, payload)

      if (res.data.success) {
        addToast('Proposta de meta atualizada com sucesso!', 'success')
        handleCloseEdit()
        fetchMetas()
      } else {
        setEditError(res.data.message || 'Erro ao atualizar a meta.')
      }
    } catch (err: any) {
      console.error(err)
      setEditError(err.response?.data?.message || 'Falha ao processar atualização no servidor.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleFinalizar = async (id: number) => {
    if (!window.confirm('Tem certeza de que deseja finalizar esta meta? Caso o aparelho tenha sido desligado por ela, ele voltará a funcionar imediatamente.')) {
      return
    }

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
                          onClick={() => handleOpenEdit(m)} 
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
                        onClick={() => handleFinalizar(m.id)}
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

      {/* Edit Meta Modal */}
      {editingMeta && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Editar Proposta de Meta #{editingMeta.id}</h3>
              <button onClick={handleCloseEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)' }}>
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="toast toast-error" style={{ position: 'relative', margin: '0 0 16px 0', right: 0, bottom: 0, minWidth: 'auto' }}>
                <span className="toast-message">{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="edit-tipo">Tipo de Meta *</label>
                <select
                  id="edit-tipo"
                  className="form-input"
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value)}
                  disabled={isSavingEdit}
                  required
                >
                  <option value="0">Consumo em kWh</option>
                  <option value="1">Gasto Financeiro em R$</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="edit-valor">
                  Valor Limite ({editTipo === '0' ? 'kWh' : 'R$'}) *
                </label>
                <input
                  id="edit-valor"
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={editValor}
                  onChange={(e) => setEditValor(e.target.value)}
                  disabled={isSavingEdit}
                  required
                />
              </div>

              {/* Edit Period */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="edit-datainicio">Data de Início *</label>
                <input
                  id="edit-datainicio"
                  type="date"
                  className="form-input"
                  value={editDataInicio}
                  onChange={(e) => setEditDataInicio(e.target.value)}
                  disabled={isSavingEdit}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="edit-datafim" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Data de Término</span>
                  <label style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontWeight: 'normal' }}>
                    <input
                      type="checkbox"
                      checked={editTempoIndeterminado}
                      onChange={(e) => setEditTempoIndeterminado(e.target.checked)}
                      disabled={isSavingEdit}
                    />
                    Tempo Indeterminado
                  </label>
                </label>
                <input
                  id="edit-datafim"
                  type="date"
                  className="form-input"
                  value={editDataFim}
                  onChange={(e) => setEditDataFim(e.target.value)}
                  disabled={editTempoIndeterminado || isSavingEdit}
                  required={!editTempoIndeterminado}
                  style={{ opacity: editTempoIndeterminado ? 0.5 : 1 }}
                />
              </div>

              {/* Edit Desligar ao Estourar */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editDesligarAoEstourar}
                    onChange={(e) => setEditDesligarAoEstourar(e.target.checked)}
                    disabled={isSavingEdit}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>Desligar aparelho automaticamente ao estourar</span>
                </label>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" htmlFor="edit-justificativa">Justificativa *</label>
                <textarea
                  id="edit-justificativa"
                  className="form-input"
                  rows={3}
                  maxLength={250}
                  value={editJustificativa}
                  onChange={(e) => setEditJustificativa(e.target.value)}
                  disabled={isSavingEdit}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>
                  <span>Min 5, máx 250 caracteres.</span>
                  <span>{editJustificativa.length}/250</span>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseEdit} className="btn-secondary" disabled={isSavingEdit}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} disabled={isSavingEdit}>
                  {isSavingEdit ? <Spinner size="sm" color="white" /> : <Save size={14} />}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
