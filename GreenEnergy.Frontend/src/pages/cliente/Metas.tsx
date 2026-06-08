import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Plus, Edit3, X, Save } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

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
}

export const Metas: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [metas, setMetas] = useState<Meta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Edit Modal State
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null)
  const [editTipo, setEditTipo] = useState('0') // 0 = kWh, 1 = Financeira
  const [editValor, setEditValor] = useState('')
  const [editJustificativa, setEditJustificativa] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const fetchMetas = async () => {
    try {
      setIsLoading(true)
      
      // 1. Busca dispositivos do cliente
      const devicesRes = await api.get('/dispositivos')
      if (!devicesRes.data.success) {
        setMetas([])
        return
      }

      const devices = devicesRes.data.data || []
      if (devices.length === 0) {
        setMetas([])
        return
      }

      // 2. Busca metas de cada dispositivo em paralelo
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
      
      // Ordena por ID decrescente (mais recentes primeiro)
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

    try {
      setIsSavingEdit(true)
      const payload = {
        tipoMeta: parseInt(editTipo, 10),
        valorLimite: val,
        justificativa: editJustificativa.trim()
      }

      const res = await api.put(`/metas/${editingMeta.id}`, payload)

      if (res.data.success) {
        addToast('Proposta de meta atualizada com sucesso!', 'success')
        handleCloseEdit()
        fetchMetas() // Recarrega dados
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
          {metas.map((m) => (
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
                    <span style={{ fontSize: '14px', color: 'var(--gray-500)', fontWeight: '500' }}>
                      ({translateTipo(m.tipoMeta)})
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StatusBadge status={m.status} label={translateStatus(m.status)} />
                    
                    {(m.status === 'Proposta' || m.status === 'Devolvida') && (
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block', marginBottom: '4px' }}>Aparelho</span>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gray-900)' }}>{m.dispositivoNome}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block', marginBottom: '4px' }}>Valor Limite Planejado</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--green-700)' }}>{formatValor(m.tipoMeta, m.valorLimite)}</span>
                  </div>
                </div>

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
              </div>
            </div>
          ))}
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
