import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Radio, Wrench, ShieldAlert, RefreshCw, CheckCircle2, AlertTriangle, Globe, Activity } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { SkeletonCard } from '../../components/ui/Skeleton'
import api from '../../services/api'
import { formatNumber } from '../../utils/format'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface AdminDashboardData {
  volumeTotalEnergiaKWh: number
  statusApisExternas: Record<string, string>
  saudeWorkerService: string
  sensoresAtivosCount: number
  sensoresInativosCount: number
  chamadosPendentesCount: number
}

// Dados simulados para o gráfico de volume de telemetria das últimas 24h
const mockTelemetryActivity = [
  { hora: '00:00', mensagens: 420 },
  { hora: '02:00', mensagens: 380 },
  { hora: '04:00', mensagens: 310 },
  { hora: '06:00', mensagens: 490 },
  { hora: '08:00', mensagens: 680 },
  { hora: '10:00', mensagens: 820 },
  { hora: '12:00', mensagens: 950 },
  { hora: '14:00', mensagens: 1050 },
  { hora: '16:00', mensagens: 1100 },
  { hora: '18:00', mensagens: 980 },
  { hora: '20:00', mensagens: 850 },
  { hora: '22:00', mensagens: 600 }
]

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      else setIsRefreshing(true)
      
      setError(null)
      const res = await api.get('/dashboard/admin')
      if (res.data.success) {
        setData(res.data.data)
      } else {
        setError(res.data.message || 'Erro ao carregar dados do cockpit.')
      }
    } catch (err: any) {
      console.error('Erro ao buscar dados do cockpit admin:', err)
      setError('Erro de conexão com a API de administração.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="units-header-actions" style={{ marginBottom: '32px' }}>
          <div>
            <h1 className="dashboard-title">Cockpit do Ecossistema</h1>
            <p className="dashboard-subtitle">Carregando indicadores em tempo real...</p>
          </div>
        </div>
        <div className="metrics-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  const getWorkerBadgeClass = (status: string) => {
    return status.toLowerCase() === 'saudavel' ? 'badge-success' : 'badge-danger'
  }

  return (
    <div className="dashboard-container">
      <div className="units-header-actions" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="dashboard-title">Cockpit do Ecossistema</h1>
          <p className="dashboard-subtitle">
            Visão geral da integridade do sistema, tráfego de telemetria e APIs de suporte integradas.
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={() => fetchDashboardData(true)}
          disabled={isRefreshing}
          title="Atualizar dados"
          style={{ padding: '10px' }}
        >
          {isRefreshing ? <Spinner size="sm" /> : <RefreshCw size={16} />}
        </button>
      </div>

      {error && (
        <div className="error-card" style={{ marginBottom: '24px', width: '100%', maxWidth: 'none' }}>
          <div className="error-card-title">Falha ao Sincronizar</div>
          <div className="error-card-message">{error}</div>
          <button className="btn-primary" onClick={() => fetchDashboardData()}>
            Tentar Novamente
          </button>
        </div>
      )}

      {data && (
        <>
          <div className="metrics-grid">
            {/* Volume Total de Energia */}
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Volume Total na Rede</span>
                <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-700)' }}>
                  <Zap size={20} />
                </div>
              </div>
              <div className="kpi-value">{formatNumber(data.volumeTotalEnergiaKWh, 2)} kWh</div>
              <div className="kpi-footer">Consumo agregado medido por todos os sensores</div>
            </div>

            {/* Sensores Ativos vs Inativos */}
            <div className="kpi-card" onClick={() => navigate('/admin/usuarios')} style={{ cursor: 'pointer' }}>
              <div className="kpi-card-header">
                <span className="kpi-title">Sensores em Operação</span>
                <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-700)' }}>
                  <Radio size={20} />
                </div>
              </div>
              <div className="kpi-value">
                {data.sensoresAtivosCount} <span style={{ fontSize: '16px', fontWeight: 'normal', color: 'var(--gray-500)' }}>ativos</span>
              </div>
              <div className="kpi-footer" style={{ color: 'var(--gray-500)' }}>
                {data.sensoresInativosCount} sensores ociosos ou em manutenção no estoque
              </div>
            </div>

            {/* Chamados Pendentes */}
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Chamados Pendentes</span>
                <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-700)' }}>
                  <Wrench size={20} />
                </div>
              </div>
              <div className="kpi-value">{data.chamadosPendentesCount}</div>
              <div className="kpi-footer">Solicitações técnicas aguardando análise/perícia</div>
            </div>

            {/* Worker Service Health */}
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Worker Background</span>
                <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-700)' }}>
                  <ShieldAlert size={20} />
                </div>
              </div>
              <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`status-badge ${getWorkerBadgeClass(data.saudeWorkerService)}`}>
                  {data.saudeWorkerService}
                </span>
              </div>
              <div className="kpi-footer">
                {data.saudeWorkerService.toLowerCase() === 'saudavel' 
                  ? 'Geração e processamento de alertas ativo (Heartbeat OK)' 
                  : 'Aviso: Serviço em background inativo há mais de 2 minutos'}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '32px',
            marginTop: '32px'
          }}>
            {/* Status das APIs */}
            <div style={{
              backgroundColor: 'var(--white-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--white-muted)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={20} style={{ color: 'var(--green-700)' }} />
                Integrações de APIs
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(data.statusApisExternas).map(([apiName, status]) => (
                  <div 
                    key={apiName} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--white-soft)',
                      border: '1px solid var(--white-muted)'
                    }}
                  >
                    <span style={{ fontWeight: '500', color: 'var(--gray-900)' }}>{apiName}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      {status === 'Configurada' ? (
                        <>
                          <CheckCircle2 size={16} color="var(--green-500)" />
                          <span style={{ color: 'var(--green-700)', fontWeight: '500' }}>Ativa</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} color="var(--amber-400)" />
                          <span style={{ color: '#d97706', fontWeight: '500' }}>Não Configurada</span>
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <button 
                className="btn-secondary" 
                onClick={() => navigate('/admin/configuracoes/apis')} 
                style={{ width: '100%', marginTop: '24px' }}
              >
                Gerenciar Chaves de APIs
              </button>
            </div>

            {/* Gráfico de Telemetria */}
            <div style={{
              backgroundColor: 'var(--white-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--white-muted)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Activity size={20} style={{ color: 'var(--green-700)' }} />
                  Mensagens Processadas (Rede)
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Últimas 24 horas</span>
              </div>
              
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTelemetryActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="telemetryGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--green-700)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--green-700)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--white-muted)" />
                    <XAxis dataKey="hora" stroke="var(--gray-500)" fontSize={12} tickLine={false} />
                    <YAxis stroke="var(--gray-500)" fontSize={12} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--white-pure)', 
                        borderColor: 'var(--white-muted)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="mensagens" 
                      name="Leituras/h"
                      stroke="var(--green-700)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#telemetryGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
