import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { useToast } from '../../components/ui/Toast'
import { Spinner } from '../../components/ui/Spinner'
import api from '../../services/api'

interface Sensor {
  id: number
  status: string
}

interface Device {
  id: number
  nome: string
  potenciaWatts: number
  sensor?: Sensor
}

export const ChamadoNovo: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(true)

  // Form states
  const [dispositivoId, setDispositivoId] = useState('')
  const [tipo, setTipo] = useState('0') // 0 = Instalacao, 1 = Remocao, 2 = Manutencao
  const [descricao, setDescricao] = useState('')
  const [showAllDevices, setShowAllDevices] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setIsLoadingDevices(true)
        const res = await api.get('/dispositivos')
        if (res.data.success) {
          setDevices(res.data.data || [])
        }
      } catch (err) {
        console.error('Erro ao buscar dispositivos:', err)
        addToast('Erro ao carregar dispositivos do cliente.', 'error')
      } finally {
        setIsLoadingDevices(false)
      }
    }

    fetchDevices()
  }, [])

  // Filter devices based on tipo
  useEffect(() => {
    if (showAllDevices) {
      setFilteredDevices(devices)
      return
    }

    const t = parseInt(tipo, 10)
    if (t === 0) {
      // Instalacao: Devices without active sensor
      setFilteredDevices(devices.filter(d => !d.sensor))
    } else {
      // Remocao/Manutencao: Devices with sensor
      setFilteredDevices(devices.filter(d => !!d.sensor))
    }
  }, [tipo, devices, showAllDevices])

  // Reset selected device if it's no longer in the filtered list
  useEffect(() => {
    if (filteredDevices.length > 0) {
      const exists = filteredDevices.some(d => d.id.toString() === dispositivoId)
      if (!exists) {
        setDispositivoId(filteredDevices[0].id.toString())
      }
    } else {
      setDispositivoId('')
    }
  }, [filteredDevices, dispositivoId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!dispositivoId) {
      setErrorMessage('Por favor, selecione um dispositivo.')
      return
    }

    if (descricao.trim().length < 5 || descricao.trim().length > 500) {
      setErrorMessage('A descrição deve ter entre 5 e 500 caracteres.')
      return
    }

    try {
      setIsSaving(true)

      const payload = {
        dispositivoId: parseInt(dispositivoId, 10),
        tipo: parseInt(tipo, 10),
        descricao: descricao.trim()
      }

      const res = await api.post('/chamados', payload)

      if (res.data.success) {
        addToast('Chamado aberto com sucesso!', 'success')
        navigate('/cliente/chamados')
      } else {
        setErrorMessage(res.data.message || 'Erro ao abrir chamado.')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.response?.data?.message || 'Falha ao processar requisição no servidor.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header" style={{ maxWidth: '800px', margin: '0 auto 32px auto' }}>
        <button 
          onClick={() => navigate('/cliente/chamados')} 
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '6px 12px' }}
        >
          <ArrowLeft size={14} />
          Voltar
        </button>
        <h1 className="dashboard-title">Abrir Novo Chamado</h1>
        <p className="dashboard-subtitle">Solicite intervenções de instalação de novos sensores, manutenção de sinal ou remoção de ativos.</p>
      </header>

      <div className="form-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {errorMessage && (
          <div className="toast toast-error" style={{ position: 'relative', margin: '0 0 24px 0', right: 0, bottom: 0, minWidth: 'auto' }}>
            <span className="toast-message">{errorMessage}</span>
          </div>
        )}

        {isLoadingDevices ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
            <Spinner size="md" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="profile-row">
              {/* Tipo de Chamado */}
              <div className="form-group">
                <label className="form-label" htmlFor="tipo-chamado">Tipo de Chamado *</label>
                <select
                  id="tipo-chamado"
                  className="form-input"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  disabled={isSaving}
                  required
                >
                  <option value="0">Instalação de Sensor (Novo Hardware)</option>
                  <option value="1">Remoção de Dispositivo</option>
                  <option value="2">Manutenção Técnica</option>
                </select>
              </div>

              {/* Seletor de Dispositivo */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" htmlFor="dispositivo-id" style={{ margin: 0 }}>Dispositivo *</label>
                  <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--green-700)', fontWeight: '500' }}>
                    <input 
                      type="checkbox" 
                      checked={showAllDevices} 
                      onChange={(e) => setShowAllDevices(e.target.checked)} 
                    />
                    Mostrar todos
                  </label>
                </div>
                
                {filteredDevices.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--amber-400)', padding: '10px', backgroundColor: 'rgba(251, 191, 36, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                    Nenhum dispositivo elegível encontrado para este tipo de chamado.
                  </div>
                ) : (
                  <select
                    id="dispositivo-id"
                    className="form-input"
                    value={dispositivoId}
                    onChange={(e) => setDispositivoId(e.target.value)}
                    disabled={isSaving}
                    required
                  >
                    {filteredDevices.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nome} ({d.potenciaWatts}W) {d.sensor ? '• Sensor Ativo' : '• Sem Sensor'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Descrição */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label" htmlFor="descricao">Descrição Detalhada *</label>
              <textarea
                id="descricao"
                className="form-input"
                placeholder="Descreva detalhadamente o problema ou os detalhes da solicitação de instalação/remoção."
                rows={5}
                style={{ resize: 'vertical', minHeight: '120px' }}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={isSaving}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                <span>Mínimo 5 caracteres, máximo 500.</span>
                <span>{descricao.length}/500</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              disabled={isSaving || filteredDevices.length === 0}
            >
              {isSaving ? (
                <>
                  <Spinner size="sm" color="white" />
                  Abrindo Chamado...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Abrir Chamado
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
