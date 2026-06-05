import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Plus, Cpu, Info } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import api from '../../services/api'

interface Address {
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
}

interface Unit {
  id: number
  tipoImovel: string
  cep: string
  cidade: string
  estado: string
  endereco: Address
}

interface Device {
  id: number
  unidadeConsumidoraId: number
  nome: string
  tipoAparelho: string
  potenciaWatts: number
  status: string
  categoriaNome: string
}

export const UnidadeDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [unit, setUnit] = useState<Unit | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const fetchUnitAndDevices = async () => {
      try {
        setIsLoading(true)
        setErrorMsg(null)

        const unitRes = await api.get(`/unidades/${id}`)
        if (unitRes.data.success) {
          setUnit(unitRes.data.value || unitRes.data.data)
        } else {
          setErrorMsg('Não foi possível carregar os detalhes desta unidade.')
        }

        const devicesRes = await api.get('/dispositivos')
        if (devicesRes.data.success) {
          const allDevices: Device[] = devicesRes.data.data || []
          const unitDevices = allDevices.filter(d => d.unidadeConsumidoraId === Number(id))
          setDevices(unitDevices)
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes da unidade:', err)
        setErrorMsg('Erro de conexão com o servidor.')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchUnitAndDevices()
    }
  }, [id])

  const formatCepDisplay = (cepRaw: string) => {
    const cleaned = cepRaw.replace(/\D/g, '')
    if (cleaned.length === 8) {
      return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
    }
    return cepRaw
  }



  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (errorMsg || !unit) {
    return (
      <div className="dashboard-container">
        <button onClick={() => navigate('/cliente/unidades')} className="btn-secondary" style={{ marginBottom: '20px' }}>
          <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Voltar
        </button>
        <div className="toast toast-error" style={{ position: 'relative', right: 0, bottom: 0 }}>
          <span className="toast-message">{errorMsg || 'Unidade consumidora não localizada.'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <button 
          onClick={() => navigate('/cliente/unidades')} 
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '6px 12px' }}
        >
          <ArrowLeft size={14} />
          Voltar para Unidades
        </button>
        <h1 className="dashboard-title">Unidade Consumidora #{unit.id}</h1>
        <p className="dashboard-subtitle">Informações de endereço e dispositivos inteligentes vinculados.</p>
      </header>

      <div className="unit-detail-grid">
        {/* Lado Esquerdo: Dados do Endereço */}
        <div className="unit-info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--green-900)' }}>
            <Home size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Endereço Registrado</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: '600' }}>Tipo de Imóvel</span>
              <div style={{ marginTop: '4px' }}>
                <span className={`unit-type-badge ${unit.tipoImovel.toLowerCase()}`}>
                  {unit.tipoImovel}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: '600' }}>Logradouro</span>
              <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: 'var(--gray-900)' }}>
                {unit.endereco?.logradouro || 'Não informado'}, {unit.endereco?.numero || 'S/N'}
              </p>
              {unit.endereco?.complemento && (
                <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: 'var(--gray-500)' }}>
                  Complemento: {unit.endereco.complemento}
                </p>
              )}
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: '600' }}>Bairro</span>
              <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: 'var(--gray-900)' }}>
                {unit.endereco?.bairro || 'Não informado'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: '600' }}>Cidade / Estado</span>
              <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: 'var(--gray-900)' }}>
                {unit.cidade} / {unit.estado}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: '600' }}>CEP</span>
              <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: 'var(--gray-900)' }}>
                {formatCepDisplay(unit.cep)}
              </p>
            </div>
          </div>
        </div>

        {/* Lado Direito: Lista de Aparelhos / Dispositivos */}
        <div className="unit-devices-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green-900)' }}>
              <Cpu size={20} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Aparelhos Vinculados</h3>
            </div>
            
            <button 
              className="btn-primary"
              onClick={() => navigate('/cliente/dispositivos/novo', { state: { unitId: unit.id } })}
              style={{ padding: '6px 12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} />
              Adicionar Aparelho
            </button>
          </div>

          {devices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--white-muted)', borderRadius: 'var(--radius-lg)' }}>
              <Info size={32} color="var(--gray-500)" style={{ marginBottom: '12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--gray-900)', margin: '0 0 8px 0' }}>
                Nenhum aparelho vinculado
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--gray-500)', margin: '0 0 20px 0', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
                Cadastre seus aparelhos eletrodomésticos para esta unidade para começar a mensurar os consumos.
              </p>
            </div>
          ) : (
            <div className="device-item-list">
              {devices.map((device) => (
                <div 
                  key={device.id} 
                  className="device-row-item"
                  onClick={() => navigate(`/cliente/dispositivos/${device.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="device-item-meta">
                    <div className="device-icon-container">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <span className="device-text-title">{device.nome}</span>
                      <div className="device-text-power">
                        {device.categoriaNome} — {device.potenciaWatts}W
                      </div>
                    </div>
                  </div>

                  <StatusBadge 
                    status={device.status} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
