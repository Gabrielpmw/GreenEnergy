import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  CloudSun, 
  TrendingUp, 
  TrendingDown, 
  Compass, 
  Thermometer, 
  Droplets,
  Building
} from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import api from '../../services/api'

interface Unit {
  id: number
  nome: string
  tipoImovel: string
  cep: string
  cidade: string
  estado: string
  codigoIBGE: string
}

interface ComparativoDTO {
  cep: string
  cidade: string
  tipoImovel: string
  consumoClienteKWh: number
  consumoMedioRegionalKWh: number
  diferencaPercentual: number
  mensagem: string
}

interface ClimaDTO {
  codigoIBGE: string
  cidade: string
  tempMin: number
  tempMax: number
  umidadePercent: number
  descricao: string
  atualizadoEm: string
}

export const Comparativos: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()
  
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [isLoadingUnits, setIsLoadingUnits] = useState(true)

  // Comparativos and Weather state
  const [comparativoCep, setComparativoCep] = useState<ComparativoDTO | null>(null)
  const [comparativoCidade, setComparativoCidade] = useState<ComparativoDTO | null>(null)
  const [clima, setClima] = useState<ClimaDTO | null>(null)
  
  const [activeTab, setActiveTab] = useState<'cep' | 'cidade'>('cep')
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Load consumer units
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setIsLoadingUnits(true)
        const res = await api.get('/unidades')
        if (res.data.success) {
          const list = res.data.data || []
          setUnits(list)
          if (list.length > 0) {
            setSelectedUnitId(list[0].id.toString())
          }
        }
      } catch (err) {
        console.error('Erro ao carregar unidades:', err)
        addToast('Erro ao carregar unidades consumidoras.', 'error')
      } finally {
        setIsLoadingUnits(false)
      }
    }

    fetchUnits()
  }, [])

  // Load comparative data whenever active unit changes
  useEffect(() => {
    if (!selectedUnitId) return

    const selectedUnit = units.find(u => u.id.toString() === selectedUnitId)
    if (!selectedUnit) return

    const loadData = async () => {
      try {
        setIsLoadingData(true)
        setComparativoCep(null)
        setComparativoCidade(null)
        setClima(null)

        const cepClean = selectedUnit.cep.replace(/\D/g, '')

        // Fetch parallel comparisons & climate
        const [cepRes, cityRes, climaRes] = await Promise.allSettled([
          api.get(`/enderecos/comparativo/cep/${cepClean}`),
          api.get(`/enderecos/comparativo/cidade/${encodeURIComponent(selectedUnit.cidade)}`),
          api.get(`/clima/${selectedUnit.codigoIBGE}`)
        ])

        // 1. Process CEP
        if (cepRes.status === 'fulfilled' && cepRes.value.data.success) {
          const list = cepRes.value.data.data || []
          // Find comparative for this specific unit type
          const found = list.find((c: any) => c.tipoImovel === selectedUnit.tipoImovel) || list[0]
          setComparativoCep(found || null)
        }

        // 2. Process Cidade
        if (cityRes.status === 'fulfilled' && cityRes.value.data.success) {
          const list = cityRes.value.data.data || []
          const found = list.find((c: any) => c.tipoImovel === selectedUnit.tipoImovel) || list[0]
          setComparativoCidade(found || null)
        }

        // 3. Process Clima
        if (climaRes.status === 'fulfilled' && climaRes.value.data.success) {
          setClima(climaRes.value.data.data || null)
        }

      } catch (err) {
        console.error('Erro ao buscar comparativos regionais:', err)
        addToast('Erro ao carregar dados comparativos regionais.', 'error')
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()

  }, [selectedUnitId, units])

  const selectedUnit = units.find(u => u.id.toString() === selectedUnitId)

  const getChartData = () => {
    const activeComp = activeTab === 'cep' ? comparativoCep : comparativoCidade
    if (!activeComp) return []
    
    return [
      {
        name: 'Seu Imóvel',
        'Consumo (kWh)': activeComp.consumoClienteKWh
      },
      {
        name: activeTab === 'cep' ? 'Média do CEP' : 'Média da Cidade',
        'Consumo (kWh)': activeComp.consumoMedioRegionalKWh
      }
    ]
  }

  if (isLoadingUnits) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (units.length === 0) {
    return (
      <div className="dashboard-container">
        <h1 className="dashboard-title">Comparativos Regionais</h1>
        <p className="dashboard-subtitle">Entenda o perfil de consumo da sua região.</p>
        <EmptyState
          title="Nenhuma unidade cadastrada"
          description="Você precisa cadastrar pelo menos uma unidade consumidora para obter análises regionais e comparativos de eficiência."
          actionText="Cadastrar Unidade"
          onAction={() => navigate('/cliente/unidades/nova')}
          icon={<Compass size={48} color="var(--green-700)" />}
        />
      </div>
    )
  }

  const activeComp = activeTab === 'cep' ? comparativoCep : comparativoCidade
  const chartData = getChartData()

  return (
    <div className="dashboard-container">
      <div className="units-header-actions" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="dashboard-title">Comparativos Regionais & Clima</h1>
          <p className="dashboard-subtitle">Compare a eficiência energética da sua residência com a vizinhança e acompanhe o clima local.</p>
        </div>

        {/* Seletor de Unidade Consumidora */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>Analisar:</span>
          <select
            className="form-input"
            style={{ width: '220px', padding: '6px 12px', margin: 0 }}
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
          >
            {units.map(u => (
              <option key={u.id} value={u.id}>
                {u.nome || `Unidade #${u.id}`} - {u.cidade}/{u.estado} ({u.tipoImovel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoadingData ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Coluna do Gráfico Comparativo */}
          <div className="dashboard-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--white-muted)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--green-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} style={{ color: 'var(--green-700)' }} />
                Comparativo de Eficiência ({selectedUnit?.tipoImovel})
              </h2>

              {/* Tabs CEP/Cidade */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setActiveTab('cep')}
                  className={activeTab === 'cep' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
                >
                  Comparar por CEP
                </button>
                <button
                  onClick={() => setActiveTab('cidade')}
                  className={activeTab === 'cidade' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
                >
                  Comparar por Cidade
                </button>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-500)' }}>
                Nenhum dado comparativo disponível para esta unidade na base de dados.
              </div>
            ) : (
              <ErrorBoundary>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--white-muted)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--gray-500)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'var(--gray-500)', fontSize: 12 }} unit=" kWh" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--white-pure)', 
                          borderRadius: 'var(--radius-md)', 
                          border: '1px solid var(--white-dim)',
                          boxShadow: 'var(--shadow-sm)'
                        }} 
                      />
                      <Legend />
                      <Bar 
                        dataKey="Consumo (kWh)" 
                        fill="var(--green-700)" 
                        radius={[6, 6, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {activeComp && (
                  <div 
                    style={{ 
                      marginTop: '24px', 
                      padding: '16px', 
                      borderRadius: 'var(--radius-md)',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      backgroundColor: activeComp.diferencaPercentual < 0 ? 'var(--green-50)' : '#fff5f5',
                      borderLeft: `4px solid ${activeComp.diferencaPercentual < 0 ? 'var(--green-500)' : 'var(--red-500)'}`
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      {activeComp.diferencaPercentual < 0 ? (
                        <TrendingDown size={22} style={{ color: 'var(--green-700)' }} />
                      ) : (
                        <TrendingUp size={22} style={{ color: 'var(--red-500)' }} />
                      )}
                    </span>
                    <div>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: 'var(--gray-900)' }}>
                        {activeComp.mensagem}
                      </p>
                      <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                        Comparando com outras propriedades do tipo <strong>{selectedUnit?.tipoImovel}</strong> registradas em {activeTab === 'cep' ? `CEP ${selectedUnit?.cep}` : selectedUnit?.cidade}.
                      </span>
                    </div>
                  </div>
                )}
              </ErrorBoundary>
            )}
          </div>

          {/* Coluna do Clima Local */}
          <div className="dashboard-card" style={{ padding: '24px', backgroundColor: 'var(--white-card)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--green-950)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CloudSun size={18} style={{ color: 'var(--green-700)' }} />
              Clima da Região
            </h2>

            {!clima ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--gray-500)' }}>
                Dados climáticos indisponíveis no momento.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Cabeçalho do Clima */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--green-100)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--green-700)'
                  }}>
                    <CloudSun size={32} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                      {clima.cidade}
                    </h3>
                    <span style={{ fontSize: '13px', color: 'var(--gray-500)', textTransform: 'capitalize' }}>
                      {clima.descricao}
                    </span>
                  </div>
                </div>

                {/* Temperaturas */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '12px', 
                  backgroundColor: 'var(--white-soft)', 
                  padding: '16px', 
                  borderRadius: 'var(--radius-md)' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Thermometer size={20} style={{ color: 'var(--red-500)' }} />
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Máxima</span>
                      <strong style={{ fontSize: '15px', color: 'var(--gray-900)' }}>{clima.tempMax}°C</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Thermometer size={20} style={{ color: 'var(--blue-500)' }} />
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Mínima</span>
                      <strong style={{ fontSize: '15px', color: 'var(--gray-900)' }}>{clima.tempMin}°C</strong>
                    </div>
                  </div>
                </div>

                {/* Umidade */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  border: '1px solid var(--white-muted)',
                  padding: '14px', 
                  borderRadius: 'var(--radius-md)' 
                }}>
                  <Droplets size={20} style={{ color: 'var(--blue-500)' }} />
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Umidade Relativa</span>
                    <strong style={{ fontSize: '15px', color: 'var(--gray-900)' }}>{clima.umidadePercent}%</strong>
                  </div>
                </div>

                {/* Alerta de Ar-Condicionado/Climatização */}
                {clima.tempMax > 30.0 && (
                  <div style={{ 
                    padding: '12px', 
                    borderRadius: 'var(--radius-sm)', 
                    backgroundColor: 'rgba(251, 191, 36, 0.08)', 
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    fontSize: '12px', 
                    color: '#92400e',
                    lineHeight: '1.4'
                  }}>
                    ⚠️ <strong>Temperatura Elevada!</strong> Considerar otimizar o uso de aparelhos de climatização (Ar Condicionado) para evitar aumentos de picos na tarifa vigente.
                  </div>
                )}

                {/* Última Atualização */}
                <div style={{ fontSize: '11px', color: 'var(--gray-500)', textAlign: 'right', marginTop: '12px' }}>
                  Atualizado em: {new Date(clima.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>

              </div>
            )}

          </div>

        </div>
      )}
    </div>
  )
}
