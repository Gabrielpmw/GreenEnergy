import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cpu, Plus, ArrowRight, Zap, RefreshCw } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import api from '../../services/api'

interface Sensor {
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
  sensor?: Sensor
}

interface Unit {
  id: number
  tipoImovel: string
  cep: string
  cidade: string
  estado: string
}

export const Dispositivos: React.FC = () => {
  const navigate = useNavigate()
  const [devices, setDevices] = useState<Device[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      // Carrega dispositivos
      const devicesRes = await api.get('/dispositivos')
      let devicesList: Device[] = []
      if (devicesRes.data.success) {
        devicesList = devicesRes.data.data || []
      }

      // Carrega unidades para mapear o local
      const unitsRes = await api.get('/unidades')
      if (unitsRes.data.success) {
        setUnits(unitsRes.data.data || [])
      }

      setDevices(devicesList)
    } catch (err) {
      console.error('Erro ao buscar dados de dispositivos:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getUnitDescription = (unitId: number) => {
    const unit = units.find((u) => u.id === unitId)
    if (!unit) return `Unidade #${unitId}`
    return `${unit.tipoImovel} em ${unit.cidade}/${unit.estado} (ID: ${unitId})`
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo':
        return 'badge-success'
      case 'suspenso':
        return 'badge-danger'
      default:
        return 'badge-default'
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
      <div className="units-header-actions">
        <div>
          <h1 className="dashboard-title">Meus Dispositivos</h1>
          <p className="dashboard-subtitle">
            Gerencie e monitore o consumo dos aparelhos inteligentes instalados em suas unidades.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-secondary" 
            onClick={fetchData}
            title="Atualizar lista"
            style={{ padding: '10px' }}
          >
            <RefreshCw size={16} />
          </button>
          
          <button 
            className="btn-primary" 
            onClick={() => navigate('/cliente/dispositivos/novo')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Cadastrar Aparelho
          </button>
        </div>
      </div>

      {devices.length === 0 ? (
        <EmptyState
          title="Nenhum dispositivo cadastrado"
          description="Você ainda não possui nenhum aparelho inteligente cadastrado nas suas unidades consumidoras. Adicione um aparelho para monitorar o seu consumo energético em tempo real."
          actionText="Cadastrar Primeiro Aparelho"
          onAction={() => navigate('/cliente/dispositivos/novo')}
          icon={<Cpu size={48} color="var(--green-700)" />}
        />
      ) : (
        <div className="units-grid">
          {devices.map((device) => (
            <div 
              key={device.id} 
              className="unit-card"
              onClick={() => navigate(`/cliente/dispositivos/${device.id}`)}
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div className="unit-card-title-row" style={{ marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                    {device.nome}
                  </h3>
                  <span className={`status-badge ${getStatusBadgeClass(device.status)}`}>
                    {device.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  <span className="unit-type-badge comercial" style={{ textTransform: 'capitalize' }}>
                    {device.categoriaNome || 'Outros'}
                  </span>
                  <span className="unit-type-badge residencial">
                    {device.tipoAparelho}
                  </span>
                </div>

                <div className="unit-address" style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Zap size={14} style={{ color: 'var(--amber-400)' }} />
                    <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                      Potência: {device.potenciaWatts} W
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '500' }}>Local:</span> {getUnitDescription(device.unidadeConsumidoraId)}
                  </div>
                  {device.sensor && (
                    <div style={{ marginTop: '6px', fontSize: '12px', fontStyle: 'italic' }}>
                      Sensor vinculado: {device.sensor.modeloSensor} ({device.sensor.numeroSerie})
                    </div>
                  )}
                  {!device.sensor && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--red-500)', fontWeight: '500' }}>
                      Aguardando vinculação física do sensor técnico
                    </div>
                  )}
                </div>
              </div>

              <div className="unit-card-footer" style={{ marginTop: '16px' }}>
                Ver Gráfico e Detalhes
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
