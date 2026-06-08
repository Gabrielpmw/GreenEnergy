import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Home, MapPin, RefreshCw, Cpu, Phone } from 'lucide-react'
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
  documento?: string
  telefone?: string
  unidades: UnidadeConsumidora[]
}

export const Clientes: React.FC = () => {
  const navigate = useNavigate()
  const [groupedClients, setGroupedClients] = useState<GroupedClient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchClientData = async () => {
    try {
      setIsLoading(true)
      
      // Busca unidades, chamados e clientes em paralelo
      const [unidadesRes, chamadosRes, clientesRes] = await Promise.allSettled([
        api.get('/unidades'),
        api.get('/chamados'),
        api.get('/usuarios/clientes')
      ])

      let unidades: UnidadeConsumidora[] = []
      if (unidadesRes.status === 'fulfilled' && unidadesRes.value.data.success) {
        unidades = unidadesRes.value.data.data || []
      }

      let chamados: Chamado[] = []
      if (chamadosRes.status === 'fulfilled' && chamadosRes.value.data.success) {
        chamados = chamadosRes.value.data.data || []
      }

      let clientesList: any[] = []
      if (clientesRes.status === 'fulfilled' && clientesRes.value.data.success) {
        clientesList = clientesRes.value.data.data || []
      }

      // Mapeamento de ID do usuário para Nome do Cliente usando chamados (fallback)
      const userNamesMap: { [key: number]: string } = {}
      chamados.forEach((c) => {
        userNamesMap[c.clienteId] = c.clienteNome
      })

      // Mapeamento de info dos clientes obtidos pelo endpoint de usuários
      const clientsInfoMap: { [key: number]: { nome: string; documento?: string; telefone?: string } } = {}
      clientesList.forEach((c) => {
        clientsInfoMap[c.id] = {
          nome: c.nome,
          documento: c.documento,
          telefone: c.telefone
        }
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
        const id = parseInt(key, 10)
        const info = clientsInfoMap[id]
        return {
          id,
          name: info?.nome || userNamesMap[id] || `Cliente #${id}`,
          documento: info?.documento,
          telefone: info?.telefone,
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

  const filteredClients = groupedClients.filter((c) => {
    const cleanQuery = searchQuery.toLowerCase().replace(/\D/g, '')
    const matchesName = c.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesId = c.id.toString() === searchQuery.trim()
    const matchesCpf = c.documento
      ? c.documento.replace(/\D/g, '').includes(cleanQuery)
      : false

    return matchesName || matchesId || (cleanQuery !== '' && matchesCpf)
  })

  // Função para formatar o CPF
  const formatCPF = (cpf?: string) => {
    if (!cpf) return ''
    const clean = cpf.replace(/\D/g, '')
    if (clean.length !== 11) return cpf
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`
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
          placeholder="Buscar por nome, CPF ou ID do cliente..."
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
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                borderBottom: '1px solid var(--white-muted)',
                paddingBottom: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gray-900)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} style={{ color: 'var(--green-700)' }} />
                    {client.name} 
                    <span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--gray-500)' }}>(ID: {client.id})</span>
                  </h3>
                  {client.documento && (
                    <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                      <strong>CPF:</strong> {formatCPF(client.documento)}
                    </div>
                  )}
                </div>

                {client.telefone && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13.5px',
                    color: 'var(--gray-600)',
                    backgroundColor: 'var(--white-soft)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--white-dim)'
                  }}>
                    <Phone size={14} color="var(--green-700)" />
                    <span>{client.telefone}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {client.unidades.map((u) => (
                  <div 
                    key={u.id} 
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--white-soft)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ fontSize: '13px', color: 'var(--gray-500)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Home size={16} style={{ color: 'var(--green-700)', flexShrink: 0 }} />
                        <strong style={{ fontSize: '14px', color: 'var(--gray-900)' }}>{u.nome}</strong>
                      </div>

                      <div>
                        <span>Tipo de Imóvel:</span>{' '}
                        <span className="unit-type-badge residencial" style={{ textTransform: 'capitalize', fontSize: '11px', padding: '2px 6px' }}>
                          {u.tipoImovel}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start', marginTop: '4px' }}>
                        <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>
                          {u.endereco.logradouro}, {u.endereco.numero} {u.endereco.complemento && ` - ${u.endereco.complemento}`}<br />
                          {u.endereco.bairro} — {u.endereco.cidade}/{u.endereco.uf}<br />
                          CEP: {u.endereco.cep}
                        </span>
                      </div>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={() => navigate(`/operador/dispositivos?unidadeId=${u.id}`)}
                      style={{
                        marginTop: '16px',
                        width: '100%',
                        fontSize: '12px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Cpu size={14} /> Ver Dispositivos Conectados
                    </button>
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
