import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Target } from 'lucide-react'
import { useToast } from '../../components/ui/Toast'
import { Spinner } from '../../components/ui/Spinner'
import api from '../../services/api'

interface Device {
  id: number
  nome: string
  potenciaWatts: number
  unidadeConsumidoraId: number
}

export const MetaNova: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [devices, setDevices] = useState<Device[]>([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(true)

  // Form states
  const [dispositivoId, setDispositivoId] = useState('')
  const [tipoMeta, setTipoMeta] = useState('0') // 0 = KWh, 1 = Financeira
  const [valorLimite, setValorLimite] = useState('')
  const [justificativa, setJustificativa] = useState('')
  
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch client devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setIsLoadingDevices(true)
        const res = await api.get('/dispositivos')
        if (res.data.success) {
          const list = res.data.data || []
          setDevices(list)
          if (list.length > 0) {
            setDispositivoId(list[0].id.toString())
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dispositivos:', err)
        addToast('Erro ao carregar os dispositivos.', 'error')
      } finally {
        setIsLoadingDevices(false)
      }
    }

    fetchDevices()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!dispositivoId) {
      setErrorMessage('Por favor, selecione um dispositivo.')
      return
    }

    const val = parseFloat(valorLimite)
    if (isNaN(val) || val <= 0.01) {
      setErrorMessage('O valor limite deve ser maior que 0.01.')
      return
    }

    if (justificativa.trim().length < 5 || justificativa.trim().length > 250) {
      setErrorMessage('A justificativa deve ter entre 5 e 250 caracteres.')
      return
    }

    try {
      setIsSaving(true)

      const payload = {
        dispositivoId: parseInt(dispositivoId, 10),
        tipoMeta: parseInt(tipoMeta, 10),
        valorLimite: val,
        justificativa: justificativa.trim()
      }

      const res = await api.post('/metas', payload)

      if (res.data.success) {
        addToast('Proposta de meta enviada com sucesso!', 'success')
        navigate('/cliente/metas')
      } else {
        setErrorMessage(res.data.message || 'Erro ao enviar a proposta de meta.')
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
          onClick={() => navigate('/cliente/metas')} 
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '6px 12px' }}
        >
          <ArrowLeft size={14} />
          Voltar
        </button>
        <h1 className="dashboard-title">Propor Meta de Consumo</h1>
        <p className="dashboard-subtitle">Proponha limites mensais para ajudar a mapear custos e receber alertas automáticos de economia.</p>
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
        ) : devices.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-500)' }}>
            Você precisa ter pelo menos um dispositivo cadastrado para propor uma meta.
            <button 
              className="btn-primary" 
              style={{ marginTop: '16px', display: 'block', margin: '16px auto 0 auto' }}
              onClick={() => navigate('/cliente/dispositivos/novo')}
            >
              Cadastrar Dispositivo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="profile-row">
              {/* Dispositivo */}
              <div className="form-group">
                <label className="form-label" htmlFor="dispositivo-id">Dispositivo *</label>
                <select
                  id="dispositivo-id"
                  className="form-input"
                  value={dispositivoId}
                  onChange={(e) => setDispositivoId(e.target.value)}
                  disabled={isSaving}
                  required
                >
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nome} ({d.potenciaWatts}W)
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Meta */}
              <div className="form-group">
                <label className="form-label" htmlFor="tipo-meta">Tipo de Limite *</label>
                <select
                  id="tipo-meta"
                  className="form-input"
                  value={tipoMeta}
                  onChange={(e) => setTipoMeta(e.target.value)}
                  disabled={isSaving}
                  required
                >
                  <option value="0">Consumo Energético (kWh)</option>
                  <option value="1">Limite Financeiro (R$)</option>
                </select>
              </div>
            </div>

            <div className="profile-row" style={{ marginTop: '16px' }}>
              {/* Valor Limite */}
              <div className="form-group">
                <label className="form-label" htmlFor="valor-limite">
                  Valor Limite ({tipoMeta === '0' ? 'kWh' : 'R$'}) *
                </label>
                <input
                  id="valor-limite"
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder={tipoMeta === '0' ? 'Ex: 150' : 'Ex: 120.00'}
                  value={valorLimite}
                  onChange={(e) => setValorLimite(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>
            </div>

            {/* Justificativa */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label" htmlFor="justificativa">Justificativa da Proposta *</label>
              <textarea
                id="justificativa"
                className="form-input"
                placeholder="Por que você deseja estabelecer este limite de consumo para o aparelho?"
                rows={4}
                maxLength={250}
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                disabled={isSaving}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                <span>Mínimo 5 caracteres, máximo 250.</span>
                <span>{justificativa.length}/250</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Spinner size="sm" color="white" />
                  Enviando Proposta...
                </>
              ) : (
                <>
                  <Target size={16} />
                  Enviar Proposta de Meta
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
