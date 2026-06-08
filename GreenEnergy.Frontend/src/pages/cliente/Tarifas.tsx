import React, { useEffect, useState } from 'react'
import { Zap, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import api from '../../services/api'

interface Tariff {
  id: number
  valorKWh: number
  bandeira: string // Verde, Amarela, Vermelha
  vigenciaInicio: string
  isActive: boolean
}

export const Tarifas: React.FC = () => {
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [activeTariff, setActiveTariff] = useState<Tariff | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTariffsData = async () => {
      try {
        setIsLoading(true)
        const [activeRes, allRes] = await Promise.all([
          api.get('/tarifas/ativa'),
          api.get('/tarifas')
        ])

        if (activeRes.data.success) {
          setActiveTariff(activeRes.data.data)
        }
        if (allRes.data.success) {
          // Ordena decrescente por data de início de vigência
          const list: Tariff[] = allRes.data.data || []
          list.sort((a, b) => new Date(b.vigenciaInicio).getTime() - new Date(a.vigenciaInicio).getTime())
          setTariffs(list)
        }
      } catch (err) {
        console.error('Erro ao buscar tarifas:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTariffsData()
  }, [])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        return dateStr
      }
      return date.toLocaleDateString('pt-BR')
    } catch {
      return dateStr
    }
  }

  const getBandeiraBadgeClass = (bandeira: string) => {
    switch (bandeira.toLowerCase()) {
      case 'verde':
        return 'badge-success'
      case 'amarela':
        return 'badge-warning'
      case 'vermelha':
        return 'badge-danger'
      default:
        return 'badge-default'
    }
  }

  const getBandeiraStyle = (bandeira: string) => {
    switch (bandeira.toLowerCase()) {
      case 'verde':
        return { borderLeft: '6px solid var(--green-500)', backgroundColor: 'var(--green-50)' }
      case 'amarela':
        return { borderLeft: '6px solid var(--amber-400)', backgroundColor: '#fffdf5' }
      case 'vermelha':
        return { borderLeft: '6px solid var(--red-500)', backgroundColor: '#fff5f5' }
      default:
        return { borderLeft: '6px solid var(--gray-500)', backgroundColor: 'var(--white-soft)' }
    }
  }

  const getBandeiraExplanation = (bandeira: string) => {
    switch (bandeira.toLowerCase()) {
      case 'verde':
        return 'Condições favoráveis de geração de energia. A tarifa não sofre acréscimos.'
      case 'amarela':
        return 'Condições de geração menos favoráveis. A tarifa sofre um pequeno acréscimo proporcional.'
      case 'vermelha':
        return 'Condições críticas de geração (período de seca/baixo nível dos reservatórios). A tarifa sofre acréscimo elevado.'
      default:
        return ''
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
      <div>
        <h1 className="dashboard-title">Tarifas e Bandeiras</h1>
        <p className="dashboard-subtitle">
          Consulte o valor do kWh e as bandeiras tarifárias vigentes no sistema que impactam a sua fatura.
        </p>
      </div>

      {/* Seção da Tarifa Vigente Ativa */}
      {activeTariff ? (
        <div 
          className="profile-card details-responsive-grid" 
          style={{ 
            ...getBandeiraStyle(activeTariff.bandeira),
            padding: '24px', 
            marginTop: '24px',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1.8fr',
            gap: '24px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {/* Valor da Tarifa */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
              Bandeira Vigente
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', marginBottom: '12px' }}>
              <span className={`status-badge ${getBandeiraBadgeClass(activeTariff.bandeira)}`} style={{ fontSize: '14px', padding: '6px 14px' }}>
                Bandeira {activeTariff.bandeira}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: '400', color: 'var(--gray-500)' }}>R$</span>
              <span style={{ fontSize: '48px', fontWeight: '800', color: 'var(--gray-900)', lineHeight: 1 }}>
                {activeTariff.valorKWh.toFixed(4)}
              </span>
              <span style={{ fontSize: '16px', color: 'var(--gray-500)', fontWeight: '500', marginLeft: '4px' }}>/ kWh</span>
            </div>
          </div>

          {/* Vigência e Explicação */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '1px solid var(--white-dim)', paddingLeft: '24px' }} className="tariff-expl-col">
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gray-900)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} /> Entendendo a Bandeira
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0, lineHeight: 1.5 }}>
                {getBandeiraExplanation(activeTariff.bandeira)}
              </p>
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Início da Vigência</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Calendar size={14} /> {formatDate(activeTariff.vigenciaInicio)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'block' }}>Reajuste Estimado</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--green-700)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <TrendingUp size={14} /> Histórico Estável
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="toast toast-warning" style={{ position: 'relative', bottom: 0, right: 0, minWidth: 'auto', marginTop: '24px' }}>
          <span className="toast-icon">
            <AlertCircle size={18} />
          </span>
          <span className="toast-message">
            Não há nenhuma tarifa registrada ou ativa no ecossistema de dados.
          </span>
        </div>
      )}

      {/* Histórico Completo de Reajustes */}
      <div className="profile-card" style={{ padding: '24px', marginTop: '32px' }}>
        <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Zap size={20} color="var(--green-700)" />
          Histórico Tarifário Completo
        </h2>
        <p className="profile-section-subtitle">
          Histórico cronológico das bandeiras tarifárias e reajustes homologados pelo administrador.
        </p>

        {tariffs.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: 'var(--gray-500)', fontSize: '13px', marginTop: '20px' }}>
            Nenhuma tarifa cadastrada no banco de dados.
          </p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '20px' }}>
            <table className="audit-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--white-dim)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--gray-500)', fontWeight: '600', fontSize: '13px' }}>Bandeira</th>
                  <th style={{ padding: '12px 16px', color: 'var(--gray-500)', fontWeight: '600', fontSize: '13px' }}>Valor (kWh)</th>
                  <th style={{ padding: '12px 16px', color: 'var(--gray-500)', fontWeight: '600', fontSize: '13px' }}>Início da Vigência</th>
                  <th style={{ padding: '12px 16px', color: 'var(--gray-500)', fontWeight: '600', fontSize: '13px' }}>Situação</th>
                </tr>
              </thead>
              <tbody>
                {tariffs.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--white-muted)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`status-badge ${getBandeiraBadgeClass(t.bandeira)}`}>
                        {t.bandeira}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--gray-900)' }}>
                      R$ {t.valorKWh.toFixed(4)}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--gray-500)', fontSize: '13px' }}>
                      {formatDate(t.vigenciaInicio)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`status-badge ${t.isActive ? 'badge-success' : 'badge-default'}`}>
                        {t.isActive ? 'Ativa' : 'Histórico'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
