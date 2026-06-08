import React, { useEffect, useState } from 'react'
import { Users, Home, MapPin, RefreshCw } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import api from '../../services/api'

interface UnidadeConsumidora {
  id: number
  nome: string
  usuarioId: number
  tipoImovel: string
  cep: string
  cidade: string
  estado: string
  endereco: {
    cep: string
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    uf: string
  }
}

interface Chamado {
  clienteId: number
  clienteNome: string
}

interface GroupedClient {
  id: number
  name: string
  unidades: UnidadeConsumidora[]
}

export const Clientes: React.FC = () => {
  const [groupedClients, setGroupedClients] = useState<GroupedClient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchClientData = async () => {
    try {
      setIsLoading(true)
      
      // Busca unidades e chamados em paralelo
      const [unidadesRes, chamadosRes] = await Promise.allSettled([
        api.get('/unidades'),
        api.get('/chamados')
      ])

      let unidades: UnidadeConsumidora[] = []
      if (unidadesRes.status === 'fulfilled' && unidadesRes.value.data.success) {
        unidades = unidadesRes.value.data.data || []
      }

      let chamados: Chamado[] = []
      if (chamadosRes.status === 'fulfilled' && chamadosRes.value.data.success) {
        chamados = chamadosRes.value.data.data || []
      }

      // Mapeamento de ID do usuário para Nome do Cliente usando chamados
      const userNamesMap: { [key: number]: string } = {}
      chamados.forEach((c) => {
        userNamesMap[c.clienteId] = c.clienteNome
      })

      // Agrupa unidades por Cliente
      const clientsMap: { [key: number]: UnidadeConsumidora[] } = {}
      unidades.forEach((u) => {
        if (!clientsMap[u.usuarioId]) {
          clientsMap[u.usuarioId] = []
        }
        clientsMap[u.usuarioId].push(u)
      })

      // Monta a lista consolidada
      const grouped: GroupedClient[] = Object.keys(clientsMap).map((key) => {
        const id = parseInt(key)
        return {
          id,
          name: userNamesMap[id] || `Cliente #${id}`,
          unidades: clientsMap[id]
        }
      })

      setGroupedClients(grouped)
    } catch (err) {
      console.error('Erro ao consolidar dados dos clientes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClientData()
  }, [])

  const filteredClients = groupedClients.filter(c => {
    const matchesName = c.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesId = c.id.toString() === searchQuery.trim()
    return matchesName || matchesId
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="units-header-actions" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="dashboard-title">Consulta de Clientes e Unidades</h1>
          <p className="dashboard-subtitle">Pesquise clientes cadastrados e gerencie a infraestrutura das unidades de consumo.</p>
        </div>

        <button 
          className="btn-secondary" 
          onClick={fetchClientData}
          title="Atualizar lista"
          style={{ padding: '10px' }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Busca */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Buscar por nome do cliente ou ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--white-dim)',
            backgroundColor: 'var(--white-pure)',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {filteredClients.length === 0 ? (
        <EmptyState
          title="Nenhum cliente localizado"
          description="A busca não retornou nenhum cliente ou unidade consumidora com os termos informados."
          icon={<Users size={48} color="var(--green-700)" />}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredClients.map((client) => (
            <div 
              key={client.id} 
              className="profile-card" 
              style={{ 
                maxWidth: 'none',
                padding: '24px',
                border: '1px solid var(--white-muted)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gray-900)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} style={{ color: 'var(--green-700)' }} />
                {client.name} 
                <span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--gray-500)' }}>(ID: {client.id})</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {client.unidades.map((u) => (
                  <div 
                    key={u.id} 
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--white-soft)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-muted)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Home size={16} style={{ color: 'var(--green-700)' }} />
                      <strong style={{ fontSize: '14px', color: 'var(--gray-900)' }}>{u.nome}</strong>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--gray-500)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <span>Tipo de Imóvel:</span>{' '}
                        <span className="unit-type-badge residencial" style={{ textTransform: 'capitalize', fontSize: '11px', padding: '2px 6px' }}>
                          {u.tipoImovel}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                        <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>
                          {u.endereco.logradouro}, {u.endereco.numero} {u.endereco.complemento && ` - ${u.endereco.complemento}`}<br />
                          {u.endereco.bairro} — {u.endereco.cidade}/{u.endereco.uf}<br />
                          CEP: {u.endereco.cep}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
