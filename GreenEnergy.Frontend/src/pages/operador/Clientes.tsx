import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Home, RefreshCw, Cpu } from 'lucide-react'
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
  const [expandedClientIds, setExpandedClientIds] = useState<number[]>([])

  const toggleExpand = (clientId: number) => {
    setExpandedClientIds((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    )
  }

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
    if (!cpf) return '-'
    const clean = cpf.replace(/\D/g, '')
    if (clean.length !== 11) return cpf
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`
  }

  // Função para formatar telefone
  const formatTelefone = (tel?: string) => {
    if (!tel) return '-'
    const clean = tel.replace(/\D/g, '')
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
    } else if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`
    }
    return tel
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
          <p className="dashboard-subtitle">Pesquise clientes cadastrados e gerencie a infraestrutura das unidades de consumo em formato tabular.</p>
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
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--white-pure)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--white-muted)', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--white-soft)', borderBottom: '1px solid var(--white-muted)' }}>
                <th style={{ padding: '16px', color: 'var(--gray-500)', fontWeight: '600', width: '80px' }}>ID</th>
                <th style={{ padding: '16px', color: 'var(--gray-500)', fontWeight: '600' }}>Nome</th>
                <th style={{ padding: '16px', color: 'var(--gray-500)', fontWeight: '600' }}>CPF</th>
                <th style={{ padding: '16px', color: 'var(--gray-500)', fontWeight: '600' }}>Telefone</th>
                <th style={{ padding: '16px', color: 'var(--gray-500)', fontWeight: '600', width: '180px' }}>Unidades</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const isExpanded = expandedClientIds.includes(client.id)
                return (
                  <React.Fragment key={client.id}>
                    <tr style={{ borderBottom: '1px solid var(--white-muted)', transition: 'background-color 0.2s' }} className="table-row-hover">
                      <td style={{ padding: '16px', fontWeight: '500', color: 'var(--gray-500)' }}>#{client.id}</td>
                      <td style={{ padding: '16px', fontWeight: '600', color: 'var(--gray-950)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users size={16} color="var(--green-700)" />
                          {client.name}
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--gray-700)' }}>{formatCPF(client.documento)}</td>
                      <td style={{ padding: '16px', color: 'var(--gray-700)' }}>{formatTelefone(client.telefone)}</td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={() => toggleExpand(client.id)}
                          className="btn-secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            border: '1px solid var(--white-dim)',
                            backgroundColor: isExpanded ? 'var(--green-50)' : 'var(--white-pure)',
                            color: isExpanded ? 'var(--green-700)' : 'var(--gray-700)'
                          }}
                        >
                          <Home size={13} color="var(--green-700)" />
                          {client.unidades.length === 0 ? (
                            'Sem Unidades'
                          ) : client.unidades.length === 1 ? (
                            '1 Unidade'
                          ) : (
                            `${client.unidades.length} Unidades`
                          )}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ backgroundColor: 'var(--white-soft)', borderBottom: '1px solid var(--white-muted)' }}>
                        <td colSpan={5} style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '750', color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Home size={15} color="var(--green-700)" />
                              Endereços e Ações de Dispositivos — {client.name}
                            </h4>
                            {client.unidades.length === 0 ? (
                              <span style={{ fontSize: '12px', color: 'var(--gray-400)', fontStyle: 'italic' }}>
                                Nenhuma unidade de consumo cadastrada para este cliente.
                              </span>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                                {client.unidades.map((u) => (
                                  <div
                                    key={u.id}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between',
                                      padding: '16px',
                                      backgroundColor: 'var(--white-pure)',
                                      borderRadius: 'var(--radius-md)',
                                      border: '1px solid var(--white-muted)',
                                      boxShadow: 'var(--shadow-sm)',
                                      gap: '12px'
                                    }}
                                  >
                                    <div>
                                      <span style={{ fontWeight: '700', color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px' }}>
                                        {u.nome}
                                        <span style={{ fontSize: '10.5px', fontWeight: '500', padding: '2px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--white-soft)', color: 'var(--gray-500)', border: '1px solid var(--white-muted)' }}>
                                          {u.tipoImovel}
                                        </span>
                                      </span>
                                      <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'block', marginTop: '6px', lineHeight: '1.4' }}>
                                        {u.endereco.logradouro}, {u.endereco.numero} {u.endereco.complemento ? `(${u.endereco.complemento})` : ''} <br />
                                        {u.endereco.bairro} — {u.endereco.cidade}/{u.endereco.uf} — CEP: {u.endereco.cep}
                                      </span>
                                    </div>
                                    <button
                                      className="btn-primary"
                                      onClick={() => navigate(`/operador/dispositivos?unidadeId=${u.id}`)}
                                      style={{
                                        fontSize: '12px',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        cursor: 'pointer',
                                        marginTop: '4px'
                                      }}
                                    >
                                      <Cpu size={13} />
                                      Ver Dispositivos
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
