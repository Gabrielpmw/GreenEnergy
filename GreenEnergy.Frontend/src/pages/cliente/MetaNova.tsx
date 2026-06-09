import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Target, HelpCircle, AlertTriangle, Calendar, Power } from 'lucide-react'
import { useToast } from '../../components/ui/Toast'
import { Spinner } from '../../components/ui/Spinner'
import api from '../../services/api'
import { formatNumber } from '../../utils/format'

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
  const [valorTarifa, setValorTarifa] = useState(0.65) // Fallback padrão

  // Form states
  const [dispositivoId, setDispositivoId] = useState('')
  const [tipoMeta, setTipoMeta] = useState('0') // 0 = KWh, 1 = Financeira
  const [valorLimite, setValorLimite] = useState('')
  const [justificativa, setJustificativa] = useState('')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().substring(0, 10))
  const [tempoIndeterminado, setTempoIndeterminado] = useState(true)
  const [dataFim, setDataFim] = useState('')
  const [desligarAoEstourar, setDesligarAoEstourar] = useState(false)
  
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch client devices and active tariff
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingDevices(true)
        
        const [devicesRes, tarifasRes] = await Promise.allSettled([
          api.get('/dispositivos'),
          api.get('/tarifas')
        ])

        let list: Device[] = []
        if (devicesRes.status === 'fulfilled' && devicesRes.value.data.success) {
          list = devicesRes.value.data.data || []
          setDevices(list)
          if (list.length > 0) {
            setDispositivoId(list[0].id.toString())
          }
        } else {
          addToast('Erro ao carregar dispositivos.', 'error')
        }

        if (tarifasRes.status === 'fulfilled' && tarifasRes.value.data.success) {
          const tarifasData = tarifasRes.value.data.data || []
          const active = tarifasData.find((t: any) => t.isActive)
          if (active) {
            setValorTarifa(active.valorKWh)
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados iniciais:', err)
      } finally {
        setIsLoadingDevices(false)
      }
    }

    fetchData()
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

    if (!tempoIndeterminado && !dataFim) {
      setErrorMessage('Por favor, selecione uma data de término para a meta.')
      return
    }

    if (!tempoIndeterminado && new Date(dataFim) <= new Date(dataInicio)) {
      setErrorMessage('A data de término deve ser posterior à data de início.')
      return
    }

    try {
      setIsSaving(true)

      const payload = {
        dispositivoId: parseInt(dispositivoId, 10),
        tipoMeta: parseInt(tipoMeta, 10),
        valorLimite: val,
        justificativa: justificativa.trim(),
        dataInicio: new Date(dataInicio).toISOString(),
        dataFim: tempoIndeterminado ? null : new Date(dataFim).toISOString(),
        desligarAoEstourar
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

  // Cálculos do Estimador Inteligente
  const getEstimation = () => {
    const limitNum = parseFloat(valorLimite)
    if (isNaN(limitNum) || limitNum <= 0) return null

    const device = devices.find(d => d.id.toString() === dispositivoId)
    if (!device) return null

    const watts = device.potenciaWatts
    let limitKWh = limitNum
    let limitReais = limitNum * valorTarifa

    if (tipoMeta === '1') {
      // Financeira: Converter R$ em kWh baseado na tarifa
      limitKWh = limitNum / valorTarifa
      limitReais = limitNum
    }

    // Horas contínuas = (kWh * 1000) / Watts
    const totalHours = (limitKWh * 1000) / watts
    const hoursPerDay = totalHours / 30

    // Formatação de minutos
    const formatHoursLabel = (hours: number) => {
      if (hours >= 1) {
        const wholeHours = Math.floor(hours)
        const mins = Math.round((hours - wholeHours) * 60)
        return mins > 0 ? `${wholeHours}h e ${mins}min` : `${wholeHours}h`
      } else {
        const mins = Math.round(hours * 60)
        return `${mins} minutos`
      }
    }

    return {
      limitKWh: formatNumber(limitKWh, 2),
      limitReais: formatNumber(limitReais, 2),
      totalHours: formatNumber(totalHours, 1),
      hoursPerDayLabel: formatHoursLabel(hoursPerDay),
      isLowLimit: hoursPerDay < 0.25 // Menos de 15 minutos por dia
    }
  }

  const estimation = getEstimation()
  const currentDevice = devices.find(d => d.id.toString() === dispositivoId)

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

            {/* Configuração de Período da Meta */}
            <div className="form-card" style={{ marginTop: '24px', backgroundColor: 'var(--white-soft)', border: '1px solid var(--white-dim)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="var(--green-600)" />
                Período de Validade
              </h4>

              <div className="profile-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="data-inicio">Data de Início *</label>
                  <input
                    id="data-inicio"
                    type="date"
                    className="form-input"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    disabled={isSaving}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="data-fim" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Data de Término</span>
                    <label style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 'normal' }}>
                      <input
                        type="checkbox"
                        checked={tempoIndeterminado}
                        onChange={(e) => setTempoIndeterminado(e.target.checked)}
                        disabled={isSaving}
                        style={{ accentColor: 'var(--green-600)' }}
                      />
                      Tempo Indeterminado
                    </label>
                  </label>
                  <input
                    id="data-fim"
                    type="date"
                    className="form-input"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    disabled={tempoIndeterminado || isSaving}
                    required={!tempoIndeterminado}
                    style={{ opacity: tempoIndeterminado ? 0.5 : 1 }}
                  />
                </div>
              </div>
            </div>

            {/* Ação de Desligamento Automático */}
            <div className="form-card" style={{ marginTop: '20px', backgroundColor: 'var(--white-soft)', border: '1px solid var(--white-dim)', padding: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={desligarAoEstourar}
                  onChange={(e) => setDesligarAoEstourar(e.target.checked)}
                  disabled={isSaving}
                  style={{ marginTop: '4px', accentColor: 'var(--green-600)', width: '16px', height: '16px' }}
                />
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Power size={14} color="var(--red-500)" />
                    Cortar energia automaticamente ao estourar a meta
                  </span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--gray-500)', lineHeight: '1.4' }}>
                    Se ativado, o sistema desligará (suspenderá) o fornecimento de energia deste aparelho assim que o consumo acumulado no período ultrapassar o valor limite. O aparelho voltará a funcionar normalmente quando o período da meta terminar ou se você finalizar a meta manualmente.
                  </p>
                </div>
              </label>
            </div>

            {/* Simulador/Estimador Inteligente de Metas */}
            {estimation && currentDevice && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: 'var(--green-50)',
                border: '1px solid var(--green-200)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13.5px',
                color: 'var(--green-950)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700' }}>
                  <HelpCircle size={16} color="var(--green-700)" />
                  <span>Entendendo seu Limite (Estimador GreenEnergy)</span>
                </div>
                
                <p style={{ margin: '0 0 6px 0', lineHeight: '1.4' }}>
                  Para o aparelho <strong>{currentDevice.nome} ({currentDevice.potenciaWatts}W)</strong>, o limite sugerido de{' '}
                  <strong>{valorLimite} {tipoMeta === '0' ? 'kWh' : 'R$'}</strong>{' '}
                  corresponde a aproximadamente:
                </p>
                
                <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li><strong>{estimation.totalHours} horas</strong> de funcionamento contínuo no mês.</li>
                  <li>Um limite de funcionamento médio diário de <strong>{estimation.hoursPerDayLabel}</strong> (durante 30 dias).</li>
                  {tipoMeta === '0' ? (
                    <li>Custo financeiro aproximado de <strong>R$ {estimation.limitReais}</strong> (baseado na tarifa de R$ {formatNumber(valorTarifa, 2)}/kWh).</li>
                  ) : (
                    <li>Consumo total equivalente de <strong>{estimation.limitKWh} kWh</strong> (baseado na tarifa de R$ {formatNumber(valorTarifa, 2)}/kWh).</li>
                  )}
                </ul>

                {estimation.isLowLimit && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12.5px',
                    color: '#b45309',
                    marginTop: '8px'
                  }}>
                    <AlertTriangle size={14} />
                    <span><strong>Atenção:</strong> Este limite é muito baixo para a potência deste aparelho, permitindo menos de 15 minutos de funcionamento diário. Considere aumentar o valor.</span>
                  </div>
                )}
              </div>
            )}

            {/* Justificativa */}
            <div className="form-group" style={{ marginTop: '20px' }}>
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
