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
}

export const Sensores: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [sensores, setSensores] = useState<Sensor[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
        
        // Atualiza a lista local imediatamente
        setSensores((prev) => 
          prev.map((s) => (s.id === id ? { ...s, status: res.data.data.status } : s))
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
                <th style={{ padding: '16px' }}>Status Operacional</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Alterar Status</th>
              </tr>
            </thead>
            <tbody>
              {sensores.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--white-muted)' }}>
                  {/* Modelo */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                      {s.modeloSensor}
                    </div>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
