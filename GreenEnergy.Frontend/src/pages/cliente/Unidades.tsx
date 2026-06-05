import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Plus, MapPin, ArrowRight } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
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

export const Unidades: React.FC = () => {
  const navigate = useNavigate()
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setIsLoading(true)
        const res = await api.get('/unidades')
        if (res.data.success) {
          setUnits(res.data.data || [])
        }
      } catch (err) {
        console.error('Erro ao buscar unidades:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnits()
  }, [])

  // Formata o CEP para XXXXX-XXX
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

  return (
    <div className="dashboard-container">
      <div className="units-header-actions">
        <div>
          <h1 className="dashboard-title">Minhas Unidades</h1>
          <p className="dashboard-subtitle">Acompanhe e gerencie as suas unidades consumidoras registradas.</p>
        </div>
        
        {units.length > 0 && (
          <button 
            className="btn-primary" 
            onClick={() => navigate('/cliente/unidades/nova')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Nova Unidade
          </button>
        )}
      </div>

      {units.length === 0 ? (
        <EmptyState
          title="Nenhuma unidade cadastrada"
          description="Você ainda não cadastrou nenhuma unidade consumidora. Para começar a gerenciar seus eletrodomésticos e visualizar análises de energia, adicione sua residência ou estabelecimento comercial."
          actionText="Cadastrar Primeira Unidade"
          onAction={() => navigate('/cliente/unidades/nova')}
          icon={<Home size={48} color="var(--green-700)" />}
        />
      ) : (
        <div className="units-grid">
          {units.map((unit) => (
            <div 
              key={unit.id} 
              className="unit-card"
              onClick={() => navigate(`/cliente/unidades/${unit.id}`)}
            >
              <div>
                <div className="unit-card-title-row">
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                    Unidade #{unit.id}
                  </h3>
                  <span className={`unit-type-badge ${unit.tipoImovel.toLowerCase()}`}>
                    {unit.tipoImovel}
                  </span>
                </div>

                <div className="unit-address">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                    <MapPin size={14} style={{ marginTop: '3px', flexShrink: 0, color: 'var(--green-700)' }} />
                    <span>
                      {unit.endereco?.logradouro || 'Endereço não informado'}, {unit.endereco?.numero || 'S/N'}
                      {unit.endereco?.complemento && ` - ${unit.endereco.complemento}`}
                    </span>
                  </div>
                  <div style={{ paddingLeft: '20px' }}>
                    {unit.endereco?.bairro || 'Sem Bairro'} — {unit.cidade}/{unit.estado}
                  </div>
                  <div style={{ paddingLeft: '20px', fontWeight: '500', marginTop: '4px' }}>
                    CEP: {formatCepDisplay(unit.cep)}
                  </div>
                </div>
              </div>

              <div className="unit-card-footer">
                Ver Detalhes e Aparelhos
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
