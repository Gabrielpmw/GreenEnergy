import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radio, Plus, RefreshCw } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

interface Sensor {
  id: number
  modeloSensor: string
  numeroSerie: string
  status: string
  ultimoSinal?: string
  observacao?: string
  dispositivoId?: number | null
  dispositivoNome?: string | null
  clienteNome?: string | null
  clienteCpf?: string | null
}

export const Sensores: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [sensores, setSensores] = useState<Sensor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterCpf, setFilterCpf] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchSensores = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/sensores')
      if (res.data.success) {
        setSensores(res.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao buscar sensores:', err)
      addToast('Erro ao buscar inventário de sensores.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSensores()
  }, [])

  const handleUpdateStatus = async (id: number, newStatusVal: number, statusLabel: string) => {
    try {
      const res = await api.patch(`/sensores/${id}/status?status=${newStatusVal}`)
      if (res.data.success) {
        addToast(`Status do sensor alterado para ${statusLabel}!`, 'success')
        
        // Atualiza a lista local imediatamente com todo o objeto atualizado
        setSensores((prev) => 
          prev.map((s) => (s.id === id ? res.data.data : s))
        )
      } else {
        addToast(res.data.message || 'Erro ao alterar status do sensor.', 'error')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao alterar status operacional do sensor.'
      addToast(msg, 'error')
    }
  }

  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'disponivel':
        return 'Disponível'
      case 'emuso':
        return 'Em Uso'
      case 'manutencao':
        return 'Manutenção'
      case 'defeito':
        return 'Com Defeito'
      default:
        return status
    }
  }

  const filteredSensores = sensores.filter((s) => {
    // Filtrar por CPF
    if (filterCpf.trim() !== '') {
      const cleanSearch = filterCpf.replace(/\D/g, '')
      const cleanCpf = s.clienteCpf ? s.clienteCpf.replace(/\D/g, '') : ''
      const matchClean = cleanCpf.includes(cleanSearch)
      const matchFormatted = s.clienteCpf ? s.clienteCpf.toLowerCase().includes(filterCpf.toLowerCase()) : false
      if (!matchClean && !matchFormatted) return false
    }

    // Filtrar por Status
    if (filterStatus !== '') {
      if (s.status.toLowerCase() !== filterStatus.toLowerCase()) return false
    }

    return true
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
          <h1 className="dashboard-title">Estoque de Sensores</h1>
          <p className="dashboard-subtitle">Controle de hardware medidor e monitoramento do status operacional físico.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-secondary" 
            onClick={fetchSensores}
            title="Atualizar lista"
            style={{ padding: '10px' }}
          >
            <RefreshCw size={16} />
          </button>
          
          <button 
            className="btn-primary" 
            onClick={() => navigate('/operador/sensores/novo')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Cadastrar Sensor
          </button>
        </div>
      </div>

      {sensores.length === 0 ? (
        <EmptyState
          title="Nenhum sensor cadastrado"
          description="O estoque de hardware medidor está vazio no momento. Cadastre novos sensores para provisionar nos chamados de instalação."
          actionText="Cadastrar Primeiro Sensor"
          onAction={() => navigate('/operador/sensores/novo')}
          icon={<Radio size={48} color="var(--green-700)" />}
        />
      ) : (
        <>
          {/* Barra de Filtros */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '20px',
            backgroundColor: 'var(--white-card)',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--white-muted)',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: '1', minWidth: '240px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)', marginBottom: '6px' }}>
                Buscar por CPF do Cliente
              </label>
              <input
                type="text"
                placeholder="Ex: 123.456.789-00"
                value={filterCpf}
                onChange={(e) => setFilterCpf(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--white-dim)',
                  fontSize: '14px',
                  backgroundColor: 'var(--white-pure)',
                  color: 'var(--gray-900)'
                }}
              />
            </div>

            <div style={{ width: '220px', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)', marginBottom: '6px' }}>
                Filtrar por Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--white-dim)',
                  fontSize: '14px',
                  backgroundColor: 'var(--white-pure)',
                  color: 'var(--gray-900)',
                  cursor: 'pointer'
                }}
              >
                <option value="">Todos os Status</option>
                <option value="disponivel">Disponível</option>
                <option value="emuso">Em Uso</option>
                <option value="manutencao">Manutenção</option>
                <option value="defeito">Com Defeito</option>
              </select>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--white-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--white-muted)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--white-soft)', borderBottom: '1px solid var(--white-muted)', color: 'var(--gray-500)', fontWeight: '600' }}>
                  <th style={{ padding: '16px' }}>Modelo</th>
                  <th style={{ padding: '16px' }}>Número de Série</th>
                  <th style={{ padding: '16px' }}>Cliente Associado</th>
                  <th style={{ padding: '16px' }}>Status Operacional</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Alterar Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSensores.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-500)' }}>
                      Nenhum sensor encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredSensores.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--white-muted)' }}>
                      {/* Modelo */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                          {s.modeloSensor}
                        </div>
                        {s.dispositivoNome && (
                          <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>
                            Aparelho: <strong>{s.dispositivoNome}</strong>
                          </div>
                        )}
                        {s.observacao && (
                          <div style={{ fontSize: '12px', color: 'var(--green-700)', marginTop: '4px', fontStyle: 'italic' }}>
                            Obs: {s.observacao}
                          </div>
                        )}
                      </td>

                      {/* Número de Série */}
                      <td style={{ padding: '16px', fontFamily: 'monospace', color: 'var(--gray-900)' }}>
                        {s.numeroSerie}
                      </td>

                      {/* Cliente Associado */}
                      <td style={{ padding: '16px' }}>
                        {s.clienteNome ? (
                          <div>
                            <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>{s.clienteNome}</div>
                            {s.clienteCpf && (
                              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>
                                CPF: {s.clienteCpf}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--gray-400)', fontSize: '13px' }}>Sem cliente associado</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px' }}>
                        <StatusBadge status={s.status} label={translateStatus(s.status)} />
                      </td>

                      {/* Ações */}
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <select
                            value=""
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === '0') handleUpdateStatus(s.id, 0, 'Disponível')
                              if (val === '1') handleUpdateStatus(s.id, 1, 'Em Uso')
                              if (val === '2') handleUpdateStatus(s.id, 2, 'Manutenção')
                              if (val === '3') handleUpdateStatus(s.id, 3, 'Com Defeito')
                            }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--white-dim)',
                              backgroundColor: 'var(--white-pure)',
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                             <option value="" disabled>Alterar saúde...</option>
                            {s.status.toLowerCase() !== 'emuso' && s.dispositivoId && (
                              <option value="1">Voltar ao Normal (Em Uso)</option>
                            )}
                            {s.status.toLowerCase() !== 'disponivel' && s.status.toLowerCase() !== 'emuso' && (
                              <option value="0">Marcar Disponível (Liberar)</option>
                            )}
                            {s.status.toLowerCase() !== 'manutencao' && (
                              <option value="2">Enviar para Manutenção</option>
                            )}
                            {s.status.toLowerCase() !== 'defeito' && (
                              <option value="3">Marcar Com Defeito</option>
                            )}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
