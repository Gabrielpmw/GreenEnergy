import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Cpu, Zap, Calendar, Shield, Power, FileText, Plus } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { formatNumber, formatDate } from '../../utils/format'

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
  observacao?: string
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

interface Relatorio {
  id: number
  chamadoId: number
  dispositivoId?: number
  dispositivoNome?: string
  descricao: string
  solucaoRecomendada: string
  tipoOcorrencia: string
  criadoEm: string
  operadorNome: string
}

export const DispositivoDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [device, setDevice] = useState<Device | null>(null)
  const [telemetries, setTelemetries] = useState<Telemetry[]>([])
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRelatoriosLoading, setIsRelatoriosLoading] = useState(false)

  // Modais de ações de energia
  const [actionType, setActionType] = useState<'cortar' | 'restaurar' | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Modal de Criação de Laudo
  const [isLaudoModalOpen, setIsLaudoModalOpen] = useState(false)
  const [tipoOcorrencia, setTipoOcorrencia] = useState<number>(0)
  const [laudoDescricao, setLaudoDescricao] = useState('')
  const [laudoSolucao, setLaudoSolucao] = useState('')
  const [isLaudoSubmitting, setIsLaudoSubmitting] = useState(false)

  const fetchDeviceData = async () => {
    if (!id) return
    try {
      setIsLoading(true)
      
      const deviceRes = await api.get(`/dispositivos/${id}`)
      if (deviceRes.data.success) {
        setDevice(deviceRes.data.data)
      } else {
        addToast(deviceRes.data.message || 'Erro ao carregar dispositivo.', 'error')
        navigate('/operador/dispositivos')
        return
      }

      // Telemetrias
      try {
        const telemetryRes = await api.get(`/dispositivos/${id}/telemetria`)
        if (telemetryRes.data.success) {
          setTelemetries(telemetryRes.data.data || [])
        }
      } catch (teleErr) {
        console.error('Erro ao buscar telemetrias:', teleErr)
      }

      // Laudos Técnicos
      await fetchRelatorios()

    } catch (err: any) {
      console.error('Erro ao buscar dispositivo:', err)
      const msg = err.response?.data?.message || 'Erro de comunicação com o servidor.'
      addToast(msg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRelatorios = async () => {
    if (!id) return
    try {
      setIsRelatoriosLoading(true)
      const relatoriosRes = await api.get(`/relatorios/dispositivo/${id}`)
      if (relatoriosRes.data.success) {
        setRelatorios(relatoriosRes.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao buscar relatórios técnicos:', err)
    } finally {
      setIsRelatoriosLoading(false)
    }
  }

  useEffect(() => {
    fetchDeviceData()
  }, [id])

  const handleActionClick = (type: 'cortar' | 'restaurar') => {
    setActionType(type)
    setIsConfirmOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!device || !actionType) return

    try {
      setActionLoading(true)
      const res = await api.post(`/dispositivos/${device.id}/${actionType}`)
      if (res.data.success) {
        addToast(`Comando de energia (${actionType.toUpperCase()}) aplicado com sucesso!`, 'success')
        setDevice((prev) => (prev ? { ...prev, status: res.data.data.status } : null))
      } else {
        addToast(res.data.message || 'Erro ao aplicar comando.', 'error')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao enviar comando de controle de energia.'
      addToast(msg, 'error')
    } finally {
      setActionLoading(false)
      setIsConfirmOpen(false)
      setActionType(null)
    }
  }

  const handleCreateLaudo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    if (!laudoDescricao.trim() || !laudoSolucao.trim()) {
      addToast('Por favor, preencha todos os campos obrigatórios do laudo.', 'warning')
      return
    }

    try {
      setIsLaudoSubmitting(true)
      const payload = {
        dispositivoId: parseInt(id, 10),
        tipoOcorrencia: tipoOcorrencia,
        descricao: laudoDescricao.trim(),
        solucaoRecomendada: laudoSolucao.trim()
      }

      const res = await api.post('/relatorios', payload)
      if (res.data.success) {
        addToast('Laudo Técnico criado com sucesso!', 'success')
        setIsLaudoModalOpen(false)
        setLaudoDescricao('')
        setLaudoSolucao('')
        setTipoOcorrencia(0)
        // Recarregar os relatórios e os dados do dispositivo
        fetchDeviceData()
      } else {
        addToast(res.data.message || 'Erro ao criar laudo técnico.', 'error')
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar laudo:', err)
      const msg = err.response?.data?.message || 'Falha ao processar cadastro do laudo.'
      addToast(msg, 'error')
    } finally {
      setIsLaudoSubmitting(false)
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

  // Prepara dados do gráfico de consumo
  const chartData = telemetries.map((t) => ({
    horario: formatTimeOnly(t.registradoEm),
    consumo: t.consumoKWh,
    tensao: t.tensaoV,
    corrente: t.correnteA
  }))

  const getOcorrenciaLabel = (ocorrenciaStr: string) => {
    switch (ocorrenciaStr) {
      case 'FalhaSensor': return 'Falha do Sensor'
      case 'ExcessoConsumo': return 'Excesso de Consumo'
      case 'ManutencaoRecomendada': return 'Manutenção Recomendada'
      default: return ocorrenciaStr
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!device) {
    return (
      <div className="dashboard-container">
        <button className="btn-secondary" onClick={() => navigate('/operador/dispositivos')} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="empty-state">
          <p>Dispositivo não encontrado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Botão Voltar */}
      <button 
        className="btn-secondary" 
        onClick={() => navigate('/operador/dispositivos')} 
        style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ArrowLeft size={16} /> Voltar para Dispositivos
      </button>

      {/* Header do Dispositivo */}
      <div className="units-header-actions" style={{ alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <h1 className="dashboard-title" style={{ margin: 0 }}>{device.nome}</h1>
            <StatusBadge status={device.status} />
          </div>
          <p className="dashboard-subtitle" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Cpu size={14} /> {device.categoriaNome || 'Sem Categoria'}
            </span>
            <span>• {device.tipoAparelho}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> Cadastrado em {formatDate(device.criadoEm)}
            </span>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }} className="details-responsive-grid">
        
        {/* Coluna Esquerda: Gráfico de Telemetria e Laudos Técnicos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="profile-card" style={{ padding: '24px', maxWidth: 'none' }}>
            <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={20} color="var(--green-700)" />
              Histórico de Consumo do Sensor
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
                      Este dispositivo não possui leituras de consumo registradas. Certifique-se de que há um sensor provisionado.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorConsumoOp" x1="0" y1="0" x2="0" y2="1">
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
                            return [`${formatNumber(value, 5)} kWh`, name]
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
                        fill="url(#colorConsumoOp)" 
                        strokeWidth={2}
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

          {/* Seção de Laudos Técnicos */}
          <div className="profile-card" style={{ padding: '24px', maxWidth: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <FileText size={20} color="var(--green-700)" />
                Histórico de Laudos Técnicos
              </h2>
              <button 
                className="btn-primary" 
                style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setIsLaudoModalOpen(true)}
              >
                <Plus size={14} /> Novo Laudo
              </button>
            </div>

            {isRelatoriosLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                <Spinner size="sm" />
              </div>
            ) : relatorios.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '24px',
                color: 'var(--gray-500)',
                border: '1px dashed var(--white-dim)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13.5px'
              }}>
                Nenhum laudo técnico cadastrado para este dispositivo.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {relatorios.map((r) => (
                  <div key={r.id} style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--white-muted)',
                    backgroundColor: 'var(--white-soft)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--gray-900)' }}>Laudo #{r.id}</strong>
                        {r.chamadoId && (
                          <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                            Vinculado ao chamado #{r.chamadoId}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--gray-500)' }}>
                        <div>Por: {r.operadorNome}</div>
                        <div>{formatDate(r.criadoEm)}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--gray-900)' }}>
                      <div>
                        <span style={{ fontWeight: '600', color: 'var(--gray-500)' }}>Tipo de Ocorrência: </span>
                        <span style={{ fontWeight: '600', color: 'var(--green-700)' }}>{getOcorrenciaLabel(r.tipoOcorrencia)}</span>
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', color: 'var(--gray-500)' }}>Descrição do Problema: </span>
                        <span>{r.descricao}</span>
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', color: 'var(--gray-500)' }}>Solução Recomendada: </span>
                        <span>{r.solucaoRecomendada}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Coluna Direita: Detalhes, Status, Controle Remoto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card de Controle de Energia */}
          <div className="profile-card" style={{ padding: '24px', maxWidth: 'none' }}>
            <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Power size={20} color="var(--green-700)" />
              Controle Remoto de Carga
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {device.status.toLowerCase() === 'suspenso' ? (
                <button
                  className="btn-primary"
                  onClick={() => handleActionClick('restaurar')}
                  disabled={actionLoading}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Power size={16} /> Restaurar Fornecimento de Energia
                </button>
              ) : (
                <button
                  className="btn-danger"
                  onClick={() => handleActionClick('cortar')}
                  disabled={actionLoading}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Power size={16} /> Cortar Fornecimento Total
                </button>
              )}
            </div>
          </div>

          {/* Ficha Técnica */}
          <div className="profile-card" style={{ padding: '24px', maxWidth: 'none' }}>
            <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Cpu size={20} color="var(--green-700)" />
              Ficha Técnica
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Potência Nominal</span>
                <strong style={{ color: 'var(--gray-900)' }}>{formatNumber(device.potenciaWatts, 0)} Watts</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Tipo</span>
                <strong style={{ color: 'var(--gray-900)' }}>{device.tipoAparelho}</strong>
              </div>
              {device.descricao && (
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Descrição</span>
                  <span style={{ color: 'var(--gray-900)' }}>{device.descricao}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sensor Vinculado (Somente Leitura) */}
          <div className="profile-card" style={{ padding: '24px', maxWidth: 'none' }}>
            <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Shield size={20} color="var(--green-700)" />
              Hardware de Medição
            </h2>

            {device.sensor ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Modelo</span>
                  <strong style={{ color: 'var(--gray-900)' }}>{device.sensor.modeloSensor}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Nº de Série</span>
                  <strong style={{ color: 'var(--gray-900)', fontFamily: 'monospace' }}>{device.sensor.numeroSerie}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Status Operacional</span>
                  <StatusBadge status={device.sensor.status} />
                </div>
                {device.sensor.observacao && (
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Observação / Comentário</span>
                    <strong style={{ color: 'var(--green-700)', fontStyle: 'italic', wordBreak: 'break-word', display: 'block', marginTop: '2px' }}>
                      {device.sensor.observacao}
                    </strong>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '16px',
                fontSize: '13px',
                color: 'var(--gray-500)',
                border: '1px dashed var(--green-300)',
                borderRadius: 'var(--radius-md)'
              }}>
                Dispositivo sem sensor físico vinculado.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal Confirmar Operação de Energia */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={`Confirmar Ação: ${actionType?.toUpperCase()}?`}
        message={
          actionType === 'cortar'
            ? `Você está prestes a CORTAR o fornecimento de energia elétrica deste aparelho. Esta ação é de alto impacto técnico. Confirma?`
            : `Deseja restaurar o fornecimento pleno de energia do aparelho intelligentemente?`
        }
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setIsConfirmOpen(false)
          setActionType(null)
        }}
        confirmText="Confirmar Ação"
        isDestructive={actionType === 'cortar'}
      />

      {/* Modal de Criação de Laudo Técnico */}
      {isLaudoModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="form-card" style={{ maxWidth: '600px', width: '90%', margin: '0 20px' }}>
            <h3 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <FileText size={20} color="var(--green-700)" />
              Emitir Laudo Técnico de Manutenção
            </h3>
            
            <form onSubmit={handleCreateLaudo}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-900)' }}>
                    Tipo de Ocorrência *
                  </label>
                  <select
                    className="form-input"
                    value={tipoOcorrencia}
                    onChange={(e) => setTipoOcorrencia(parseInt(e.target.value, 10))}
                    required
                    disabled={isLaudoSubmitting}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-dim)',
                      backgroundColor: 'var(--white-pure)',
                      fontSize: '13px',
                      width: '100%'
                    }}
                  >
                    <option value={0}>Falha do Sensor</option>
                    <option value={1}>Excesso de Consumo</option>
                    <option value={2}>Manutenção Recomendada</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-900)' }}>
                    Descrição do Problema *
                  </label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Descreva a ocorrência ou problema identificado..."
                    value={laudoDescricao}
                    onChange={(e) => setLaudoDescricao(e.target.value)}
                    required
                    disabled={isLaudoSubmitting}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-dim)',
                      backgroundColor: 'var(--white-pure)',
                      fontSize: '13px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-900)' }}>
                    Solução Recomendada *
                  </label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Descreva a solução executada ou ações futuras recomendadas..."
                    value={laudoSolucao}
                    onChange={(e) => setLaudoSolucao(e.target.value)}
                    required
                    disabled={isLaudoSubmitting}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-dim)',
                      backgroundColor: 'var(--white-pure)',
                      fontSize: '13px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setIsLaudoModalOpen(false)
                      setLaudoDescricao('')
                      setLaudoSolucao('')
                      setTipoOcorrencia(0)
                    }}
                    disabled={isLaudoSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLaudoSubmitting}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isLaudoSubmitting && <Spinner size="sm" color="white" />}
                    Gravar Laudo
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
