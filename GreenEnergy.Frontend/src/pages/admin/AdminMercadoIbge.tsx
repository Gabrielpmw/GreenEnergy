import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Compass, Zap, MapPin, RefreshCw } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { SkeletonCard, SkeletonRow } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import api from '../../services/api'
import { formatNumber } from '../../utils/format'

interface MercadoCidade {
  codigoIBGE: string
  cidade: string
  estado: string
  populacaoEstimada: number
  quantidadeUnidades: number
  taxaAdesaoPercentual: number
  consumoTotalKWh: number
}

export const AdminMercadoIbge: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [data, setData] = useState<MercadoCidade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMercadoData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      else setIsRefreshing(true)

      setError(null)
      const res = await api.get('/dashboard/admin/mercado-ibge')
      if (res.data.success) {
        setData(res.data.data || [])
      } else {
        setError(res.data.message || 'Erro ao carregar dados de penetração regional.')
      }
    } catch (err: any) {
      console.error('Erro ao buscar dados demográficos IBGE:', err)
      setError('Erro de conexão com a API de mercado do IBGE.')
      addToast('Erro ao carregar dados de penetração de mercado.', 'error')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMercadoData()
  }, [])

  // Cálculos de KPI
  const cidadesAtivas = data.length
  const maiorPenetracao = data.length > 0 ? data[0] : null // A API já retorna ordenado decrescentemente pela taxa

  // Dados para o gráfico Recharts (Top 5 cidades com maior taxa de adesão)
  const topCidades = data.slice(0, 5)

  // Função para retornar a cor da barra de progresso / badge da taxa de adesão
  const getTaxaColor = (taxa: number) => {
    if (taxa >= 0.1) return 'var(--green-700)' // Alta adesão
    if (taxa >= 0.01) return 'var(--green-500)' // Média-alta adesão
    if (taxa >= 0.001) return '#d97706' // Média-baixa adesão (Amarelo/Amber)
    return 'var(--gray-500)' // Baixa adesão
  }

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="units-header-actions" style={{ marginBottom: '32px' }}>
          <div>
            <h1 className="dashboard-title">Penetração de Mercado (IBGE)</h1>
            <p className="dashboard-subtitle">Carregando dados demográficos e de adesão regional...</p>
          </div>
        </div>
        <div className="metrics-grid" style={{ marginBottom: '32px' }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div style={{
          backgroundColor: 'var(--white-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--white-muted)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div className="skeleton skeleton-title" style={{ marginBottom: '20px', width: '200px' }} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <SkeletonRow cols={5} />
              <SkeletonRow cols={5} />
              <SkeletonRow cols={5} />
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="units-header-actions" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="dashboard-title">Penetração de Mercado & Dados IBGE</h1>
          <p className="dashboard-subtitle">
            Análise demográfica cruzando unidades consumidoras ativas com dados populacionais do IBGE.
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={() => fetchMercadoData(true)}
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
          <button className="btn-primary" onClick={() => fetchMercadoData()}>
            Tentar Novamente
          </button>
        </div>
      )}

      {data.length === 0 ? (
        <EmptyState
          title="Sem dados de mercado regional"
          description="Nenhuma unidade consumidora ativa foi encontrada para calcular as estatísticas demográficas por município."
          actionText="Gerenciar Usuários"
          onAction={() => navigate('/admin/usuarios')}
          icon={<Compass size={48} color="var(--green-700)" />}
        />
      ) : (
        <>
          {/* Cards de Métricas */}
          <div className="metrics-grid" style={{ marginBottom: '32px' }}>
            {/* Cidades Ativas */}
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Cidades Atendidas</span>
                <div className="kpi-icon-wrapper">
                  <MapPin size={20} />
                </div>
              </div>
              <div className="kpi-value">{cidadesAtivas}</div>
              <div className="kpi-footer">Municípios com unidades registradas</div>
            </div>

            {/* Maior Penetração */}
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Maior Penetração</span>
                <div className="kpi-icon-wrapper">
                  <Compass size={20} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: 'var(--font-size-lg)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {maiorPenetracao ? `${maiorPenetracao.cidade} (${maiorPenetracao.estado})` : '—'}
              </div>
              <div className="kpi-footer">
                Taxa de adesão: <strong>{maiorPenetracao ? `${formatNumber(maiorPenetracao.taxaAdesaoPercentual, 4)}%` : '—'}</strong>
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '32px',
            marginBottom: '32px'
          }}>
            {/* Gráfico de Penetração de Mercado */}
            <div style={{
              backgroundColor: 'var(--white-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--white-muted)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} style={{ color: 'var(--green-700)' }} />
                Top 5 Cidades por Taxa de Adesão (%)
              </h2>
              <ErrorBoundary>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCidades} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--white-muted)" />
                      <XAxis dataKey="cidade" tick={{ fill: 'var(--gray-500)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'var(--gray-500)', fontSize: 12 }} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--white-pure)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--white-dim)',
                          boxShadow: 'var(--shadow-sm)',
                          fontSize: '13px'
                        }}
                        formatter={(value: any) => [`${formatNumber(value, 4)}%`, 'Taxa de Adesão']}
                      />
                      <Bar
                        dataKey="taxaAdesaoPercentual"
                        fill="var(--green-700)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ErrorBoundary>
            </div>

            {/* Tabela de Detalhes Demográficos */}
            <div style={{
              backgroundColor: 'var(--white-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--white-muted)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
              padding: '24px'
            }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={20} style={{ color: 'var(--green-700)' }} />
                Detalhamento da Cobertura de Mercado
              </h2>
              <ErrorBoundary>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--white-soft)', borderBottom: '1px solid var(--white-muted)', color: 'var(--gray-500)', fontWeight: '600' }}>
                        <th style={{ padding: '16px' }}>Município</th>
                        <th style={{ padding: '16px' }}>População Estimada (IBGE)</th>
                        <th style={{ padding: '16px' }}>Unidades Ativas</th>
                        <th style={{ padding: '16px' }}>Consumo Acumulado</th>
                        <th style={{ padding: '16px' }}>Taxa de Adesão (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item) => (
                        <tr key={item.codigoIBGE} style={{ borderBottom: '1px solid var(--white-muted)', transition: 'background-color var(--transition-fast)' }} className="table-row-hover">
                          {/* Cidade / UF */}
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{item.cidade}</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>UF: {item.estado} | Cód. IBGE: {item.codigoIBGE}</div>
                          </td>

                          {/* População */}
                          <td style={{ padding: '16px', color: 'var(--gray-900)', fontWeight: '500' }}>
                            {formatNumber(item.populacaoEstimada, 0)}
                          </td>

                          {/* Unidades Ativas */}
                          <td style={{ padding: '16px', color: 'var(--gray-900)' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--green-50)',
                              color: 'var(--green-700)',
                              fontWeight: '600',
                              fontSize: '13px'
                            }}>
                              {item.quantidadeUnidades}
                            </span>
                          </td>

                          {/* Consumo Acumulado (kWh) */}
                          <td style={{ padding: '16px', color: 'var(--gray-900)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                              <Zap size={14} style={{ color: 'var(--green-700)' }} />
                              {formatNumber(item.consumoTotalKWh, 2)} kWh
                            </div>
                          </td>

                          {/* Taxa de Adesão % e Barra Visual */}
                          <td style={{ padding: '16px', minWidth: '220px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ flex: 1, backgroundColor: 'var(--white-muted)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                  backgroundColor: getTaxaColor(item.taxaAdesaoPercentual),
                                  width: `${Math.min(item.taxaAdesaoPercentual * 100, 100)}%`, // escala visual
                                  height: '100%'
                                }} />
                              </div>
                              <span style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                color: getTaxaColor(item.taxaAdesaoPercentual),
                                minWidth: '65px',
                                textAlign: 'right'
                              }}>
                                {formatNumber(item.taxaAdesaoPercentual, 4)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ErrorBoundary>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
