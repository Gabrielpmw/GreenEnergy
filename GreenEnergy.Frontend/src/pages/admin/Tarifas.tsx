import React, { useEffect, useState } from 'react'
import { DollarSign, Plus, RefreshCw } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import { formatNumber } from '../../utils/format'
import api from '../../services/api'

interface Tarifa {
  id: number
  bandeira: string
  valorKWh: number
  vigenciaInicio: string
  isActive: boolean
}

export const Tarifas: React.FC = () => {
  const { addToast } = useToast()

  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [activeTariff, setActiveTariff] = useState<Tarifa | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Campos do Formulário
  const [bandeiraVal, setBandeiraVal] = useState<number>(0) // 0 = Verde, 1 = Amarela, etc.
  const [valorKWh, setValorKWh] = useState('')



  const fetchTarifas = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      else setIsRefreshing(true)

      const [listRes, activeRes] = await Promise.allSettled([
        api.get('/tarifas'),
        api.get('/tarifas/ativa')
      ])

      if (listRes.status === 'fulfilled' && listRes.value.data.success) {
        setTarifas(listRes.value.data.data || [])
      }

      if (activeRes.status === 'fulfilled' && activeRes.value.data.success) {
        setActiveTariff(activeRes.value.data.data)
      } else {
        setActiveTariff(null)
      }
    } catch (err: any) {
      console.error('Erro ao buscar tarifas:', err)
      addToast('Erro ao carregar dados de tarifas.', 'error')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTarifas()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numValue = parseFloat(valorKWh)
    if (isNaN(numValue) || numValue <= 0) {
      addToast('O valor por kWh deve ser um número maior que zero.', 'warning')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await api.post('/tarifas', {
        bandeira: bandeiraVal,
        valorKWh: numValue
      })

      if (res.data.success) {
        addToast('Nova bandeira tarifária criada e ativada com sucesso!', 'success')
        setValorKWh('')
        fetchTarifas(true) // Recarrega silenciosamente
      } else {
        addToast(res.data.message || 'Erro ao criar tarifa.', 'error')
      }
    } catch (err: any) {
      console.error('Erro ao criar tarifa:', err)
      const errorMsg = err.response?.data?.message || 'Falha ao salvar nova tarifa no servidor.'
      addToast(errorMsg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }


  // Cores CSS dos Cards baseados na bandeira
  const getTariffCardClass = (band: string | undefined) => {
    if (!band) return 'tariff-green'
    const b = band.toLowerCase()
    if (b.includes('verde')) return 'tariff-green'
    if (b.includes('amarela')) return 'tariff-yellow'
    if (b.includes('vermelha')) return 'tariff-red'
    return 'tariff-green'
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="units-header-actions" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="dashboard-title">Gestão de Tarifas</h1>
          <p className="dashboard-subtitle">Homologação de bandeiras tarifárias e reajustes do custo por kWh.</p>
        </div>

        <button
          className="btn-secondary"
          onClick={() => fetchTarifas(true)}
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
        <>
          {/* Card Destaque Tarifa Vigente */}
          <div style={{ marginBottom: '32px' }}>
            <div className={`kpi-card ${getTariffCardClass(activeTariff?.bandeira)}`} style={{ maxWidth: '450px' }}>
              <div className="kpi-card-header">
                <span className="kpi-title" style={{ fontSize: '13px', fontWeight: 'bold' }}>Tarifa Vigente Oficial</span>
                <div className="kpi-icon-wrapper">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', color: 'var(--gray-900)' }}>
                {activeTariff ? `R$ ${formatNumber(activeTariff.valorKWh, 4)}` : 'N/A'}
              </div>
              <div className="kpi-footer" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-900)' }}>
                {activeTariff 
                  ? `Bandeira ${activeTariff.bandeira} (Vigente desde ${new Date(activeTariff.vigenciaInicio).toLocaleDateString('pt-BR')} ${new Date(activeTariff.vigenciaInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})` 
                  : 'Nenhuma tarifa cadastrada e ativa no sistema.'}
              </div>
            </div>
          </div>

          {/* Grid Cadastro & Histórico */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '32px',
            alignItems: 'start'
          }}>
            {/* Esquerda: Cadastro de nova tarifa */}
            <div className="form-card" style={{ margin: '0', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--green-950)', marginBottom: '20px', borderBottom: '1px solid var(--white-muted)', paddingBottom: '8px' }}>
                Novo Reajuste Tarifário
              </h2>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Seleção de Bandeira */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--gray-900)' }}>
                    Bandeira Tarifária
                  </label>
                  <select
                    value={bandeiraVal}
                    onChange={(e) => setBandeiraVal(parseInt(e.target.value))}
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-dim)',
                      backgroundColor: 'var(--white-pure)',
                      fontSize: '14px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value={0}>Verde</option>
                    <option value={1}>Amarela</option>
                    <option value={2}>Vermelha 1</option>
                    <option value={3}>Vermelha 2</option>
                  </select>
                </div>

                {/* Valor por kWh */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--gray-900)' }}>
                    Valor por kWh (R$)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    placeholder="Ex: 0.7584"
                    value={valorKWh}
                    onChange={(e) => setValorKWh(e.target.value)}
                    disabled={isSubmitting}
                    required
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-dim)',
                      backgroundColor: 'var(--white-pure)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Botão Salvar */}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isSubmitting ? <Spinner size="sm" /> : (
                    <>
                      <Plus size={16} />
                      Homologar Reajuste
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Direita: Tabela de Histórico */}
            <div style={{
              backgroundColor: 'var(--white-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--white-muted)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gray-900)', padding: '16px 24px', margin: '0', borderBottom: '1px solid var(--white-muted)', backgroundColor: 'var(--white-soft)' }}>
                Histórico de Bandeiras
              </h2>
              
              {tarifas.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-500)' }}>
                  Nenhuma tarifa cadastrada no histórico.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--white-soft)', borderBottom: '1px solid var(--white-muted)', color: 'var(--gray-500)', fontWeight: '600' }}>
                      <th style={{ padding: '16px' }}>Bandeira</th>
                      <th style={{ padding: '16px' }}>Valor (kWh)</th>
                      <th style={{ padding: '16px' }}>Vigência Inicial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tarifas.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--white-muted)' }}>
                        {/* Bandeira */}
                        <td style={{ padding: '16px', fontWeight: '600', color: 'var(--gray-900)' }}>
                          Bandeira {t.bandeira}
                        </td>
                        
                        {/* Valor */}
                        <td style={{ padding: '16px', color: 'var(--gray-900)' }}>
                          R$ {formatNumber(t.valorKWh, 4)}
                        </td>

                        {/* Vigência */}
                        <td style={{ padding: '16px', color: 'var(--gray-500)' }}>
                          {new Date(t.vigenciaInicio).toLocaleDateString('pt-BR')} {new Date(t.vigenciaInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
