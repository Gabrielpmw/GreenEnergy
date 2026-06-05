import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Home, Cpu, DollarSign, CloudSun, Leaf } from 'lucide-react'

interface Unit {
  id: number
  tipoImovel: string
  codigoIBGE: string
  cidade: string
}

interface Device {
  id: number
  nome: string
}

interface Tariff {
  bandeira: string
  valorKWh: number
}

interface Weather {
  cidade: string
  tempMin: number
  tempMax: number
  umidadePercent: number
  descricao: string
}

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [units, setUnits] = useState<Unit[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [tariff, setTariff] = useState<Tariff | null>(null)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)

        // Busca simultânea de unidades, dispositivos e tarifa
        const [unitsRes, devicesRes, tariffRes] = await Promise.allSettled([
          api.get('/unidades'),
          api.get('/dispositivos'),
          api.get('/tarifas/ativa')
        ])

        let fetchedUnits: Unit[] = []
        if (unitsRes.status === 'fulfilled' && unitsRes.value.data.success) {
          fetchedUnits = unitsRes.value.data.data || []
          setUnits(fetchedUnits)
        }

        if (devicesRes.status === 'fulfilled' && devicesRes.value.data.success) {
          setDevices(devicesRes.value.data.data || [])
        }

        if (tariffRes.status === 'fulfilled' && tariffRes.value.data.success) {
          setTariff(tariffRes.value.data.data)
        } else {
          setTariff(null)
        }

        // Se o usuário possuir unidades, busca o clima da primeira unidade consumidora (IBGE)
        if (fetchedUnits.length > 0) {
          const ibgeCode = fetchedUnits[0].codigoIBGE
          if (ibgeCode) {
            try {
              const climaRes = await api.get(`/clima/${ibgeCode}`)
              if (climaRes.data.success) {
                setWeather(climaRes.data.data)
              }
            } catch (err) {
              console.error('Erro ao buscar o clima:', err)
              setWeatherError('Não foi possível obter a previsão do tempo.')
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Determinar a classe de cor do card da tarifa com base na bandeira
  const getTariffClass = (band: string | undefined) => {
    if (!band) return 'tariff-green'
    const normalized = band.toLowerCase()
    if (normalized.includes('verde')) return 'tariff-green'
    if (normalized.includes('amarela')) return 'tariff-yellow'
    if (normalized.includes('vermelha')) return 'tariff-red'
    return 'tariff-green'
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Olá, {user?.nome || 'Usuário'}!</h1>
        <p className="dashboard-subtitle">Bem-vindo ao seu painel de gestão de energia inteligente.</p>
      </header>

      {isLoading ? (
        <div className="metrics-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          <div className="metrics-grid">
            {/* KPI 1: Unidades */}
            <div className="kpi-card" onClick={() => navigate('/cliente/unidades')} style={{ cursor: 'pointer' }}>
              <div className="kpi-card-header">
                <span className="kpi-title">Minhas Unidades</span>
                <div className="kpi-icon-wrapper">
                  <Home size={20} />
                </div>
              </div>
              <div className="kpi-value">{units.length}</div>
              <div className="kpi-footer">Unidades consumidoras cadastradas</div>
            </div>

            {/* KPI 2: Dispositivos */}
            <div className="kpi-card" onClick={() => navigate('/cliente/dispositivos')} style={{ cursor: 'pointer' }}>
              <div className="kpi-card-header">
                <span className="kpi-title">Dispositivos</span>
                <div className="kpi-icon-wrapper">
                  <Cpu size={20} />
                </div>
              </div>
              <div className="kpi-value">{devices.length}</div>
              <div className="kpi-footer">Aparelhos inteligentes vinculados</div>
            </div>

            {/* KPI 3: Tarifa Vigente */}
            <div className={`kpi-card ${getTariffClass(tariff?.bandeira)}`} onClick={() => navigate('/cliente/tarifas')} style={{ cursor: 'pointer' }}>
              <div className="kpi-card-header">
                <span className="kpi-title">Tarifa Vigente</span>
                <div className="kpi-icon-wrapper">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="kpi-value">
                {tariff ? `R$ ${tariff.valorKWh.toFixed(2)}` : 'N/A'}
              </div>
              <div className="kpi-footer" style={{ fontWeight: '600' }}>
                {tariff ? `Bandeira ${tariff.bandeira}` : 'Sem tarifa ativa cadastrada'}
              </div>
            </div>

            {/* KPI 4: Clima Local */}
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Clima Local</span>
                <div className="kpi-icon-wrapper">
                  <CloudSun size={20} />
                </div>
              </div>
              {units.length === 0 ? (
                <div className="kpi-footer" style={{ marginTop: '0', fontSize: '13px', color: 'var(--gray-500)' }}>
                  Cadastre uma unidade para ver o clima.
                </div>
              ) : weather ? (
                <>
                  <div className="kpi-value">{Math.round(weather.tempMax)}°C</div>
                  <div className="kpi-footer" style={{ marginTop: '0' }}>
                    {weather.cidade} — {weather.descricao} ({weather.umidadePercent}% UR)
                  </div>
                </>
              ) : (
                <div className="kpi-footer" style={{ marginTop: '0', fontSize: '13px', color: 'var(--gray-500)' }}>
                  {weatherError || 'Carregando dados do clima...'}
                </div>
              )}
            </div>
          </div>

          {/* Se o cliente não tem nenhum dispositivo, renderiza um Empty State incentivando a ação */}
          {devices.length === 0 && (
            <div style={{ marginTop: '20px' }}>
              <EmptyState
                title="Sua jornada de eficiência começa aqui"
                description="Você ainda não possui aparelhos cadastrados no sistema. Adicione sua primeira unidade consumidora e vincule seus eletrodomésticos para monitorar o consumo real e receber alertas inteligentes de gastos."
                actionText={units.length === 0 ? 'Cadastrar Primeira Unidade' : 'Vincular Novo Aparelho'}
                onAction={() => {
                  if (units.length === 0) {
                    navigate('/cliente/unidades/nova')
                  } else {
                    navigate('/cliente/dispositivos/novo')
                  }
                }}
                icon={<Leaf size={48} color="var(--green-700)" />}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
