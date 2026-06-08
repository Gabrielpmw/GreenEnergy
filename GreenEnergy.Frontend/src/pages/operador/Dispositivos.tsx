import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cpu, RefreshCw, AlertTriangle, Eye, Power, Slash } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

interface Sensor {
  id: number
  modeloSensor: string
  numeroSerie: string
  status: string
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
  sensor?: Sensor
}

interface Chamado {
  id: number
  dispositivoId: number
  tipo: string
  status: string
}

export const Dispositivos: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [devices, setDevices] = useState<Device[]>([])
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Controle de Modal de Ação
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [actionType, setActionType] = useState<'limitar' | 'cortar' | 'restaurar' | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      // Buscas paralelas tolerantes a falhas
      const [devicesRes, chamadosRes] = await Promise.allSettled([
        api.get('/dispositivos'),
        api.get('/chamados')
      ])

      let devicesList: Device[] = []
      if (devicesRes.status === 'fulfilled' && devicesRes.value.data.success) {
        devicesList = devicesRes.value.data.data || []
      } else {
        addToast('Erro ao carregar dispositivos do ecossistema.', 'error')
      }

      let chamadosList: Chamado[] = []
      if (chamadosRes.status === 'fulfilled' && chamadosRes.value.data.success) {
        chamadosList = chamadosRes.value.data.data || []
      }

      setDevices(devicesList)
      setChamados(chamadosList)
    } catch (err) {
      console.error('Erro ao consolidar dados de dispositivos:', err)
      addToast('Ocorreu um erro ao carregar os dados.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const hasPendingRemoval = (deviceId: number) => {
    return chamados.some((c) => 
      c.dispositivoId === deviceId &&
      c.tipo.toLowerCase() === 'remocao' &&
      (c.status.toLowerCase() === 'pendente' || c.status.toLowerCase() === 'emanalise' || c.status.toLowerCase() === 'ematendimento')
    )
  }

  const handleActionClick = (device: Device, type: 'limitar' | 'cortar' | 'restaurar') => {
    setSelectedDevice(device)
    setActionType(type)
    setIsConfirmOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!selectedDevice || !actionType) return

    try {
      const res = await api.post(`/dispositivos/${selectedDevice.id}/${actionType}`)
      if (res.data.success) {
        addToast(`Comando de energia (${actionType.toUpperCase()}) enviado com sucesso!`, 'success')
        
        // Atualiza a lista local imediatamente
        setDevices((prev) => 
          prev.map((d) => (d.id === selectedDevice.id ? { ...d, status: res.data.data.status } : d))
        )
      } else {
        addToast(res.data.message || 'Erro ao executar comando de energia.', 'error')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao processar comando remoto de energia.'
      addToast(msg, 'error')
    } finally {
      setIsConfirmOpen(false)
      setSelectedDevice(null)
      setActionType(null)
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
          <h1 className="dashboard-title">Dispositivos do Ecossistema</h1>
          <p className="dashboard-subtitle">Visualização e controle remoto de fornecimento de energia para aparelhos inteligentes.</p>
        </div>

        <button 
          className="btn-secondary" 
          onClick={fetchData}
          title="Atualizar lista"
          style={{ padding: '10px' }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {devices.length === 0 ? (
        <EmptyState
          title="Nenhum dispositivo encontrado"
          description="Não há dispositivos inteligentes integrados ao ecossistema no momento."
          icon={<Cpu size={48} color="var(--green-700)" />}
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
                <th style={{ padding: '16px' }}>Nome/Categoria</th>
                <th style={{ padding: '16px' }}>Unidade</th>
                <th style={{ padding: '16px' }}>Hardware (Sensor)</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => {
                const pendingRemoval = hasPendingRemoval(d.id)
                return (
                  <tr 
                    key={d.id} 
                    style={{ 
                      borderBottom: '1px solid var(--white-muted)', 
                      backgroundColor: pendingRemoval ? '#fffbeb' : 'inherit',
                      transition: 'background-color var(--transition-fast)'
                    }}
                  >
                    {/* Nome/Categoria */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{d.nome}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                        {d.categoriaNome || 'Outros'} — {d.potenciaWatts}W
                      </div>
                    </td>

                    {/* Unidade */}
                    <td style={{ padding: '16px', color: 'var(--gray-900)' }}>
                      Unidade #{d.unidadeConsumidoraId}
                    </td>

                    {/* Sensor */}
                    <td style={{ padding: '16px' }}>
                      {d.sensor ? (
                        <div>
                          <span style={{ fontWeight: '500', color: 'var(--gray-900)' }}>{d.sensor.modeloSensor}</span>
                          <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>S/N: {d.sensor.numeroSerie}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--red-500)', fontSize: '12px', fontWeight: '500' }}>Sem sensor ativo</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <StatusBadge status={d.status} />
                        {pendingRemoval && (
                          <span style={{ 
                            fontSize: '10px', 
                            backgroundColor: '#fef3c7', 
                            color: '#b45309', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <AlertTriangle size={10} /> Remoção Solicitada
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Ações */}
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => navigate(`/operador/dispositivos/${d.id}`)}
                          title="Ver detalhes e telemetria"
                          style={{ padding: '8px 12px' }}
                        >
                          <Eye size={14} /> Detalhes
                        </button>

                        <button
                          className="btn-secondary"
                          onClick={() => handleActionClick(d, 'limitar')}
                          title="Limitar Consumo"
                          disabled={d.status.toLowerCase() === 'suspenso' || pendingRemoval}
                          style={{ padding: '8px 12px' }}
                        >
                          <Slash size={14} style={{ color: 'var(--amber-400)' }} /> Limitar
                        </button>

                        {d.status.toLowerCase() === 'suspenso' ? (
                          <button
                            className="btn-primary"
                            onClick={() => handleActionClick(d, 'restaurar')}
                            title="Restaurar Energia"
                            disabled={pendingRemoval}
                            style={{ padding: '8px 12px' }}
                          >
                            <Power size={14} /> Restaurar
                          </button>
                        ) : (
                          <button
                            className="btn-danger"
                            onClick={() => handleActionClick(d, 'cortar')}
                            title="Cortar Fornecimento"
                            disabled={pendingRemoval}
                            style={{ padding: '8px 12px' }}
                          >
                            <Power size={14} /> Cortar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Confirmar Operação de Energia */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={`Confirmar Comando: ${actionType?.toUpperCase()}?`}
        message={
          actionType === 'cortar'
            ? `Deseja realmente CORTAR o fornecimento de energia elétrica do aparelho "${selectedDevice?.nome}"? Esta ação interromperá as operações de consumo imediatamente.`
            : actionType === 'limitar'
              ? `Deseja limitar a potência de operação do aparelho "${selectedDevice?.nome}" para o limite econômico estabelecido?`
              : `Deseja restaurar o fornecimento pleno de energia do aparelho "${selectedDevice?.nome}"?`
        }
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setIsConfirmOpen(false)
          setSelectedDevice(null)
          setActionType(null)
        }}
        confirmText="Confirmar Ação"
        isDestructive={actionType === 'cortar'}
      />
    </div>
  )
}
