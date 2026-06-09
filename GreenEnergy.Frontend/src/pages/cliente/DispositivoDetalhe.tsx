import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Cpu, Zap, Calendar, Shield, AlertTriangle, 
  MessageSquare, Edit3, Trash2, Plus, Check, X, Target
} from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import api from '../../services/api'
import { formatNumber } from '../../utils/format'

// Recharts imports
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts'

interface SensorResponse {
  id: number
  modeloSensor: string
  numeroSerie: string
  status: string
  ultimoSinal?: string
}

interface Device {
  id: number
  unidadeConsumidoraId: number
  categoriaId: number
  categoriaNome: string
  nome: string
  tipoAparelho: string
  descricao?: string
  potenciaWatts: number
  status: string
  criadoEm: string
  sensor?: SensorResponse
}

interface Telemetry {
  id: number
  sensorId: number
  consumoKWh: number
  tensaoV: number
  correnteA: number
  registradoEm: string
}

interface Annotation {
  id: number
  dispositivoId: number
  clienteId: number
  clienteNome: string
  conteudo: string
  criadoEm: string
}

interface Goal {
  id: number
  dispositivoId: number
  dispositivoNome: string
  tipoMeta: string // e.g. "KWh" ou "ValorR$"
  valorLimite: number
  status: string // e.g. "Proposta", "Aprovada", "Devolvida"
  justificativa?: string
  observacoesOperador?: string
}

interface ActiveTariff {
  id: number
  valorKWh: number
  bandeira: string
}

export const DispositivoDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [device, setDevice] = useState<Device | null>(null)
  const [telemetries, setTelemetries] = useState<Telemetry[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [activeTariff, setActiveTariff] = useState<ActiveTariff | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Inline Annotation creation state
  const [newAnnotationText, setNewAnnotationText] = useState('')
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false)

  // Inline Annotation edit states
  const [editingAnnotationId, setEditingAnnotationId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [isUpdatingAnnotation, setIsUpdatingAnnotation] = useState(false)

  const fetchDeviceData = async () => {
    if (!id) return
    try {
      setIsLoading(true)
      setErrorMsg('')

      // 1. Detalhes do Dispositivo
      const deviceRes = await api.get(`/dispositivos/${id}`)
      if (!deviceRes.data.success) {
        setErrorMsg(deviceRes.data.message || 'Aparelho não localizado.')
        setIsLoading(false)
        return
      }
      const devData: Device = deviceRes.data.data
      setDevice(devData)

      // 2. Telemetrias (Consumo histórico)
      try {
        const telemetryRes = await api.get(`/dispositivos/${id}/telemetria`)
        if (telemetryRes.data.success) {
          setTelemetries(telemetryRes.data.data || [])
        }
      } catch (telemetryErr) {
        console.error('Erro ao buscar telemetrias:', telemetryErr)
      }

      // 3. Anotações
      try {
        const annotationsRes = await api.get(`/dispositivos/${id}/anotacoes`)
        if (annotationsRes.data.success) {
          setAnnotations(annotationsRes.data.data || [])
        }
      } catch (annotationsErr) {
        console.error('Erro ao buscar anotações:', annotationsErr)
      }

      // 4. Metas
      try {
        const goalsRes = await api.get(`/metas/dispositivo/${id}`)
        if (goalsRes.data.success) {
          setGoals(goalsRes.data.data || [])
        }
      } catch (goalsErr) {
        console.error('Erro ao buscar metas:', goalsErr)
      }

      // 5. Tarifa Ativa
      try {
        const tariffRes = await api.get('/tarifas/ativa')
        if (tariffRes.data.success) {
          setActiveTariff(tariffRes.data.data)
        }
      } catch (tariffErr) {
        console.error('Erro ao buscar tarifa ativa:', tariffErr)
      }

    } catch (err: any) {
      console.error('Erro geral ao buscar detalhes do dispositivo:', err)
      setErrorMsg(err.response?.data?.message || 'Erro de comunicação com o servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDeviceData()
  }, [id])

  // Formatar data do C#
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const formatTimeOnly = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  // --- Operações de Anotações ---

  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAnnotationText.trim() || !id) return

    try {
      setIsAddingAnnotation(true)
      const res = await api.post(`/dispositivos/${id}/anotacoes`, {
        conteudo: newAnnotationText.trim()
      })

      if (res.data.success) {
        addToast('Anotação registrada com sucesso!', 'success')
        setNewAnnotationText('')
        // Recarrega a lista de anotações
        const updatedRes = await api.get(`/dispositivos/${id}/anotacoes`)
        if (updatedRes.data.success) {
          setAnnotations(updatedRes.data.data || [])
        }
      } else {
        addToast(res.data.message || 'Erro ao adicionar anotação.', 'error')
      }
    } catch (err: any) {
      console.error('Erro ao criar anotação:', err)
      const msg = err.response?.data?.message || 'Erro ao comunicar com o servidor.'
      addToast(msg, 'error')
    } finally {
      setIsAddingAnnotation(false)
    }
  }

  const handleStartEdit = (ann: Annotation) => {
    setEditingAnnotationId(ann.id)
    setEditingText(ann.conteudo)
  }

  const handleCancelEdit = () => {
    setEditingAnnotationId(null)
    setEditingText('')
  }

  const handleUpdateAnnotation = async (annId: number) => {
    if (!editingText.trim()) return

    try {
      setIsUpdatingAnnotation(true)
      const res = await api.put(`/dispositivos/anotacoes/${annId}`, {
        conteudo: editingText.trim()
      })

      if (res.data.success) {
        addToast('Anotação atualizada!', 'success')
        setEditingAnnotationId(null)
        setEditingText('')
        // Recarrega lista
        const updatedRes = await api.get(`/dispositivos/${id}/anotacoes`)
        if (updatedRes.data.success) {
          setAnnotations(updatedRes.data.data || [])
        }
      } else {
        addToast(res.data.message || 'Erro ao atualizar anotação.', 'error')
      }
    } catch (err: any) {
      console.error('Erro ao atualizar anotação:', err)
      const msg = err.response?.data?.message || 'Erro ao comunicar com o servidor.'
      addToast(msg, 'error')
    } finally {
      setIsUpdatingAnnotation(false)
    }
  }

  const handleDeleteAnnotation = async (annId: number) => {
    if (!window.confirm('Deseja realmente excluir esta anotação?')) return

    try {
      const res = await api.delete(`/dispositivos/anotacoes/${annId}`)
      if (res.data.success) {
        addToast('Anotação excluída com sucesso.', 'success')
        setAnnotations((prev) => prev.filter((a) => a.id !== annId))
      } else {
        addToast(res.data.message || 'Erro ao excluir anotação.', 'error')
      }
    } catch (err: any) {
      console.error('Erro ao excluir anotação:', err)
      const msg = err.response?.data?.message || 'Erro ao comunicar com o servidor.'
      addToast(msg, 'error')
    }
  }

  // Prepara dados do gráfico de consumo
  const chartData = telemetries.map((t) => {
    const costEstimate = activeTariff ? t.consumoKWh * activeTariff.valorKWh : 0
    return {
      horario: formatTimeOnly(t.registradoEm),
      consumo: t.consumoKWh, // Mantém a precisão para dispositivos de baixa potência
      custo: costEstimate, // Mantém precisão centesimal/milesimal para custo
      tensao: t.tensaoV,
      corrente: t.correnteA
    }
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (errorMsg || !device) {
    return (
      <div className="dashboard-container">
        <button className="btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="toast toast-error" style={{ position: 'relative', right: 0, bottom: 0, minWidth: 'auto' }}>
          <span className="toast-icon">
            <AlertTriangle size={18} />
          </span>
          <span className="toast-message">{errorMsg || 'Aparelho não localizado.'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Botão de Voltar */}
      <div style={{ marginBottom: '20px' }}>
        <button className="btn-secondary" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} />
          Voltar para Lista
        </button>
      </div>

      {/* Título e Metadados do Aparelho */}
      <div className="units-header-actions" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <h1 className="dashboard-title" style={{ margin: 0 }}>{device.nome}</h1>
            <span className={`status-badge ${device.status.toLowerCase() === 'ativo' ? 'badge-success' : 'badge-danger'}`}>
              {device.status}
            </span>
          </div>
          <p className="dashboard-subtitle" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Cpu size={14} /> {device.categoriaNome || 'Sem Categoria'}
            </span>
            <span>• {device.tipoAparelho}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> Cadastrado em {formatDateTime(device.criadoEm)}
            </span>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginTop: '24px' }} className="details-responsive-grid">
        
        {/* Coluna Esquerda: Gráfico de Consumo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card de Gráfico de Consumo */}
          <div className="profile-card" style={{ padding: '24px' }}>
            <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={20} color="var(--green-700)" />
              Histórico de Consumo (Tempo Real)
            </h2>
            
            <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
              <ErrorBoundary>
                {chartData.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    border: '1px dashed var(--green-300)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--gray-500)',
                    padding: '24px',
                    textAlign: 'center'
                  }}>
                    <Zap size={36} color="var(--green-700)" style={{ marginBottom: '12px', opacity: 0.7 }} />
                    <p style={{ fontWeight: '600', margin: '0 0 4px 0', color: 'var(--green-950)' }}>Sem telemetria ativa</p>
                    <p style={{ fontSize: '13px', maxWidth: '380px', margin: 0 }}>
                      Este aparelho ainda não possui leituras de consumo registradas. Certifique-se de que há um sensor vinculado e o simulador está rodando.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--green-500)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--green-500)" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--white-muted)" />
                      <XAxis dataKey="horario" stroke="var(--gray-500)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--gray-500)" fontSize={11} tickLine={false} width={65} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'var(--white-pure)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--white-dim)',
                          boxShadow: 'var(--shadow-md)'
                        }}
                        formatter={(value: any, name: any) => {
                          if (name === 'Consumo (kWh)') {
                            return [`${formatNumber(parseFloat(value), 5)} kWh`, name]
                          }
                          if (name === 'Custo Est. (R$)') {
                            return [`R$ ${formatNumber(parseFloat(value), 4)}`, name]
                          }
                          return [value, name]
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area 
                        name="Consumo (kWh)" 
                        type="monotone" 
                        dataKey="consumo" 
                        stroke="var(--green-700)" 
                        fillOpacity={1} 
                        fill="url(#colorConsumo)" 
                        strokeWidth={2}
                      />
                      <Area 
                        name="Custo Est. (R$)" 
                        type="monotone" 
                        dataKey="custo" 
                        stroke="var(--amber-400)" 
                        fill="none" 
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ErrorBoundary>
            </div>

            {device.sensor && chartData.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '12px', 
                marginTop: '20px', 
                borderTop: '1px solid var(--white-muted)',
                paddingTop: '16px' 
              }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Tensão Média</span>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--gray-900)' }}>
                    {formatNumber(telemetries.reduce((acc, t) => acc + t.tensaoV, 0) / telemetries.length, 1)} V
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Corrente Média</span>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--gray-900)' }}>
                    {formatNumber(telemetries.reduce((acc, t) => acc + t.correnteA, 0) / telemetries.length, 2)} A
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Leituras Recebidas</span>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--green-700)' }}>
                    {telemetries.length} / 30
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Painel de Anotações */}
          <div className="profile-card" style={{ padding: '24px' }}>
            <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <MessageSquare size={20} color="var(--green-700)" />
              Anotações do Aparelho
            </h2>
            <p className="profile-section-subtitle">
              Registre notas sobre manutenção, consumo ou observações do aparelho técnico.
            </p>

            {/* Lista de Anotações */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {annotations.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'var(--gray-500)', fontSize: '13px', margin: '12px 0' }}>
                  Nenhuma anotação registrada para este aparelho inteligente.
                </p>
              ) : (
                annotations.map((ann) => (
                  <div 
                    key={ann.id} 
                    style={{ 
                      padding: '12px 16px', 
                      backgroundColor: 'var(--white-soft)', 
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-muted)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      {editingAnnotationId === ann.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          <textarea
                            className="form-input"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={2}
                            required
                          />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn-secondary" 
                              onClick={handleCancelEdit}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              disabled={isUpdatingAnnotation}
                            >
                              <X size={12} /> Cancelar
                            </button>
                            <button 
                              className="btn-primary" 
                              onClick={() => handleUpdateAnnotation(ann.id)}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              disabled={isUpdatingAnnotation || !editingText.trim()}
                            >
                              {isUpdatingAnnotation ? <Spinner size="sm" color="white" /> : <Check size={12} />} Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--gray-900)', whiteSpace: 'pre-wrap' }}>
                            {ann.conteudo}
                          </p>
                          <span style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                            Por {ann.clienteNome} em {formatDateTime(ann.criadoEm)}
                          </span>
                        </>
                      )}
                    </div>

                    {editingAnnotationId !== ann.id && (
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button 
                          className="btn-secondary" 
                          onClick={() => handleStartEdit(ann)}
                          style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
                          title="Editar"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          className="btn-secondary" 
                          onClick={() => handleDeleteAnnotation(ann.id)}
                          style={{ padding: '6px', borderRadius: 'var(--radius-sm)', color: 'var(--red-500)', borderColor: '#fee2e2' }}
                          title="Excluir"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Nova Anotação */}
            <form onSubmit={handleAddAnnotation} style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Adicione uma nova anotação inline..."
                value={newAnnotationText}
                onChange={(e) => setNewAnnotationText(e.target.value)}
                required
                disabled={isAddingAnnotation}
                style={{ flex: 1 }}
              />
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isAddingAnnotation || !newAnnotationText.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                {isAddingAnnotation ? <Spinner size="sm" color="white" /> : <Plus size={16} />}
                Adicionar
              </button>
            </form>
          </div>

        </div>

        {/* Coluna Direita: Métricas / Sensor / Metas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card de Ficha do Aparelho */}
          <div className="profile-card" style={{ padding: '24px' }}>
            <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={20} color="var(--green-700)" />
              Especificações
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block' }}>Potência</span>
                <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{device.potenciaWatts} Watts</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block' }}>Tipo do Aparelho</span>
                <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{device.tipoAparelho}</span>
              </div>
              {device.descricao && (
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block' }}>Descrição</span>
                  <span style={{ fontSize: '13px', color: 'var(--gray-900)' }}>{device.descricao}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card do Hardware de Medição (Sensor) */}
          <div className="profile-card" style={{ padding: '24px' }}>
            <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Shield size={20} color="var(--green-700)" />
              Sensor Físico Vinculado
            </h2>

            {device.sensor ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block' }}>Modelo de Sensor</span>
                  <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{device.sensor.modeloSensor}</span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block' }}>Número de Série</span>
                  <span style={{ fontWeight: '600', fontFamily: 'monospace', color: 'var(--gray-900)' }}>{device.sensor.numeroSerie}</span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block' }}>Status Físico</span>
                  <span className={`status-badge badge-success`} style={{ marginTop: '4px' }}>
                    {device.sensor.status}
                  </span>
                </div>
                {device.sensor.ultimoSinal && (
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block' }}>Último Sinal</span>
                    <span style={{ fontSize: '12px', color: 'var(--gray-900)' }}>{formatDateTime(device.sensor.ultimoSinal)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '16px', color: 'var(--gray-500)' }}>
                <div className="toast toast-warning" style={{ position: 'relative', bottom: 0, right: 0, minWidth: 'auto', margin: 0 }}>
                  <span className="toast-icon">
                    <AlertTriangle size={18} />
                  </span>
                  <span className="toast-message" style={{ fontSize: '12px' }}>
                    Sem sensor cadastrado. Solicite a instalação de sensores físicos abrindo um chamado de instalação.
                  </span>
                </div>
                
                <button 
                  className="btn-secondary" 
                  onClick={() => navigate('/cliente/chamados/novo')}
                  style={{ width: '100%', marginTop: '16px', fontSize: '13px' }}
                >
                  Solicitar Instalação de Sensor
                </button>
              </div>
            )}
          </div>

          {/* Card de Metas Vinculadas */}
          <div className="profile-card" style={{ padding: '24px' }}>
            <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Target size={20} color="var(--green-700)" />
              Metas de Consumo
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {goals.length === 0 ? (
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: '0 0 12px 0' }}>
                    Nenhuma meta de limite de consumo proposta para este aparelho.
                  </p>
                  <button 
                    className="btn-secondary" 
                    onClick={() => navigate('/cliente/metas/nova')}
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    Propor Nova Meta
                  </button>
                </div>
              ) : (
                goals.map((goal) => (
                  <div 
                    key={goal.id} 
                    style={{ 
                      padding: '10px 14px', 
                      backgroundColor: 'var(--white-soft)', 
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gray-900)' }}>
                        Limite: {goal.valorLimite} {goal.tipoMeta === 'KWh' ? 'kWh' : 'R$'}
                      </span>
                      <span className={`status-badge ${
                        goal.status.toLowerCase() === 'aprovada' ? 'badge-success' : 
                        goal.status.toLowerCase() === 'devolvida' ? 'badge-danger' : 'badge-warning'
                      }`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {goal.status}
                      </span>
                    </div>
                    {goal.justificativa && (
                      <p style={{ fontSize: '11px', color: 'var(--gray-500)', margin: '4px 0 0 0' }}>
                        <strong>Motivo:</strong> {goal.justificativa}
                      </p>
                    )}
                    {goal.observacoesOperador && (
                      <p style={{ fontSize: '11px', color: 'var(--red-500)', margin: '4px 0 0 0', borderTop: '1px dashed var(--white-dim)', paddingTop: '4px' }}>
                        <strong>Retorno do Operador:</strong> {goal.observacoesOperador}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
