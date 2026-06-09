import React, { useEffect, useState } from 'react'
import { Save, Eye, EyeOff, Globe, CheckCircle2, RefreshCw } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

interface ConfigAPI {
  id: number
  nomeAPI: string
  chaveAcesso: string
  baseUrl: string
}

export const ConfigApis: React.FC = () => {
  const { addToast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Dados do OpenWeather buscados da API
  const [openWeatherId, setOpenWeatherId] = useState<number | null>(null)
  const [openWeatherUrl, setOpenWeatherUrl] = useState('https://api.openweathermap.org/data/2.5')
  const [openWeatherKey, setOpenWeatherKey] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const fetchConfigs = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      else setIsRefreshing(true)

      const res = await api.get('/configuracaoapi')
      if (res.data.success) {
        const list: ConfigAPI[] = res.data.data || []
        
        // Procura configuração existente para o OpenWeather
        const weatherCfg = list.find((c) => c.nomeAPI.toLowerCase() === 'openweather')
        if (weatherCfg) {
          setOpenWeatherId(weatherCfg.id)
          setOpenWeatherUrl(weatherCfg.baseUrl)
          setOpenWeatherKey(weatherCfg.chaveAcesso)
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar configurações de APIs:', err)
      addToast('Erro ao carregar configurações de APIs do servidor.', 'error')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  const handleSaveOpenWeather = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!openWeatherUrl.trim()) {
      addToast('A URL base do OpenWeather é obrigatória.', 'warning')
      return
    }
    if (!openWeatherKey.trim()) {
      addToast('A chave de acesso do OpenWeather é obrigatória.', 'warning')
      return
    }

    try {
      setIsSaving(true)
      
      if (openWeatherId) {
        // Atualiza configuração existente
        const res = await api.put(`/configuracaoapi/${openWeatherId}`, {
          chaveAcesso: openWeatherKey,
          baseUrl: openWeatherUrl
        })

        if (res.data.success) {
          addToast('Configuração do OpenWeather atualizada com sucesso!', 'success')
          fetchConfigs(true)
        } else {
          addToast(res.data.message || 'Erro ao atualizar configuração.', 'error')
        }
      } else {
        // Cria nova configuração
        const res = await api.post('/configuracaoapi', {
          nomeAPI: 'OpenWeather',
          chaveAcesso: openWeatherKey,
          baseUrl: openWeatherUrl
        })

        if (res.data.success) {
          addToast('Configuração do OpenWeather criada com sucesso!', 'success')
          fetchConfigs(true)
        } else {
          addToast(res.data.message || 'Erro ao criar configuração.', 'error')
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar configuração OpenWeather:', err)
      const errorMsg = err.response?.data?.message || 'Falha ao salvar configuração no servidor.'
      addToast(errorMsg, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="units-header-actions" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="dashboard-title">Configurações de APIs</h1>
          <p className="dashboard-subtitle">Gerenciamento de endpoints e chaves de acesso para APIs parceiras e serviços.</p>
        </div>

        <button
          className="btn-secondary"
          onClick={() => fetchConfigs(true)}
          disabled={isRefreshing}
          title="Atualizar dados"
          style={{ padding: '10px' }}
        >
          {isRefreshing ? <Spinner size="sm" /> : <RefreshCw size={16} />}
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {/* Card OpenWeather (Editável) */}
          <div style={{
            backgroundColor: 'var(--white-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--white-muted)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gray-900)', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={20} style={{ color: 'var(--green-700)' }} />
                  OpenWeather Map
                </h2>
                <span className={`status-badge ${openWeatherId ? 'badge-success' : 'badge-warning'}`}>
                  {openWeatherId ? 'Configurada' : 'Pendente'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--gray-500)', lineHeight: '1.4', marginBottom: '20px' }}>
                Fornece dados em tempo real sobre temperatura, umidade e descrição do clima para cálculo de correlação térmica de consumo.
              </p>

              <form onSubmit={handleSaveOpenWeather} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* URL Base */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--gray-900)' }}>
                    URL Base *
                  </label>
                  <input
                    type="url"
                    placeholder="https://api.openweathermap.org/data/2.5"
                    value={openWeatherUrl}
                    onChange={(e) => setOpenWeatherUrl(e.target.value)}
                    disabled={isSaving}
                    required
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-dim)',
                      backgroundColor: 'var(--white-pure)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Chave de Acesso */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--gray-900)' }}>
                    Chave de Acesso (API Key) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Chave privada de acesso (APPID)"
                      value={openWeatherKey}
                      onChange={(e) => setOpenWeatherKey(e.target.value)}
                      disabled={isSaving}
                      required
                      style={{
                        padding: '10px 40px 10px 12px',
                        width: '100%',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--white-dim)',
                        backgroundColor: 'var(--white-pure)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--gray-500)',
                        cursor: 'pointer',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Botão Salvar */}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSaving}
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%'
                  }}
                >
                  {isSaving ? <Spinner size="sm" /> : (
                    <>
                      <Save size={16} />
                      Salvar Integração
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Card ViaCEP (Estático/Público) */}
          <div style={{
            backgroundColor: 'var(--white-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--white-muted)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gray-900)', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={20} style={{ color: 'var(--green-700)' }} />
                  ViaCEP API
                </h2>
                <span className="status-badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Ativa (Pública)
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--gray-500)', lineHeight: '1.4', marginBottom: '20px' }}>
                Utilizada para autocompletar e validar dados de endereços residenciais e comerciais a partir do CEP informado pelo cliente no cadastro.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--gray-500)' }}>URL Base de Consulta</span>
                  <code style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--white-soft)',
                    border: '1px solid var(--white-muted)',
                    fontSize: '12px',
                    color: 'var(--green-900)',
                    wordBreak: 'break-all'
                  }}>
                    https://viacep.com.br/ws/
                  </code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--gray-500)' }}>Autenticação</span>
                  <span style={{ fontSize: '13px', color: 'var(--gray-900)', fontWeight: '500' }}>Não requer chaves de acesso adicionais.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card IBGE (Estático/Público) */}
          <div style={{
            backgroundColor: 'var(--white-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--white-muted)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gray-900)', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={20} style={{ color: 'var(--green-700)' }} />
                  IBGE Localidades
                </h2>
                <span className="status-badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Ativa (Pública)
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--gray-500)', lineHeight: '1.4', marginBottom: '20px' }}>
                Consome dados sobre as regiões imediatas, intermediárias e códigos geográficos oficiais do município para indexação de telemetrias.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--gray-500)' }}>URL Base de Consulta</span>
                  <code style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--white-soft)',
                    border: '1px solid var(--white-muted)',
                    fontSize: '12px',
                    color: 'var(--green-900)',
                    wordBreak: 'break-all'
                  }}>
                    https://servicodados.ibge.gov.br/api/v1/
                  </code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--gray-500)' }}>Autenticação</span>
                  <span style={{ fontSize: '13px', color: 'var(--gray-900)', fontWeight: '500' }}>Não requer chaves de acesso adicionais.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
