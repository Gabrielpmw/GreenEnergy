import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Cpu, Zap, Calendar, Shield, Power, Slash } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

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

export const DispositivoDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [device, setDevice] = useState<Device | null>(null)
  const [telemetries, setTelemetries] = useState<Telemetry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modais de ações de energia
  const [actionType, setActionType] = useState<'limitar' | 'cortar' | 'restaurar' | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

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

    } catch (err: any) {
      console.error('Erro ao buscar dispositivo:', err)
      const msg = err.response?.data?.message || 'Erro de comunicação com o servidor.'
      addToast(msg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDeviceData()
  }, [id])

  const handleActionClick = (type: 'limitar' | 'cortar' | 'restaurar') => {
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

  // Prepara dados do gráfico de consumo
  const chartData = telemetries.map((t) => ({
    horario: formatTimeOnly(t.registradoEm),
    consumo: t.consumoKWh,
    tensao: t.tensaoV,
    corrente: t.correnteA
  }))

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
              <Calendar size={14} /> Cadastrado em {formatDateTime(device.criadoEm)}
            </span>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }} className="details-responsive-grid">
        
        {/* Coluna Esquerda: Gráfico de Telemetria */}
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
                            return [`${parseFloat(value).toFixed(5)} kWh`, name]
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
                    {Math.round(telemetries.reduce((acc, t) => acc + t.tensaoV, 0) / telemetries.length)}V
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Corrente Média</span>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--gray-900)' }}>
                    {(telemetries.reduce((acc, t) => acc + t.correnteA, 0) / telemetries.length).toFixed(2)}A
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
              <button
                className="btn-secondary"
                onClick={() => handleActionClick('limitar')}
                disabled={device.status.toLowerCase() === 'suspenso' || actionLoading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Slash size={16} style={{ color: 'var(--amber-400)' }} /> Limitar Carga de Operação
              </button>

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
                <strong style={{ color: 'var(--gray-900)' }}>{device.potenciaWatts} Watts</strong>
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
            : actionType === 'limitar'
              ? `Deseja limitar a potência de operação do aparelho intelligentemente para economizar consumo?`
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
    </div>
  )
}
