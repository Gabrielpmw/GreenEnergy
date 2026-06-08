import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, Radio, Target, RefreshCw } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import api from '../../services/api'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [chamadosCount, setChamadosCount] = useState<number | null>(null)
  const [sensoresCount, setSensoresCount] = useState<number | null>(null)
  const [metasCount, setMetasCount] = useState<number | null>(null)
  
  const [loadingChamados, setLoadingChamados] = useState(true)
  const [loadingSensores, setLoadingSensores] = useState(true)
  const [loadingMetas, setLoadingMetas] = useState(true)

  const fetchChamados = async () => {
    try {
      setLoadingChamados(true)
      const res = await api.get('/chamados')
      if (res.data.success) {
        const list = res.data.data || []
        // Filtra chamados Pendentes ou EmAnalise
        const count = list.filter((c: any) => 
          c.status.toLowerCase() === 'pendente' || 
          c.status.toLowerCase() === 'emanalise' || 
          c.status.toLowerCase() === 'ematendimento'
        ).length
        setChamadosCount(count)
      } else {
        setChamadosCount(0)
      }
    } catch (err) {
      console.error('Erro ao buscar chamados para o painel:', err)
      setChamadosCount(null) // Representa erro individual
    } finally {
      setLoadingChamados(false)
    }
  }

  const fetchSensores = async () => {
    try {
      setLoadingSensores(true)
      const res = await api.get('/sensores/disponiveis')
      if (res.data.success) {
        setSensoresCount((res.data.data || []).length)
      } else {
        setSensoresCount(0)
      }
    } catch (err) {
      console.error('Erro ao buscar sensores disponíveis:', err)
      setSensoresCount(null)
    } finally {
      setLoadingSensores(false)
    }
  }

  const fetchMetas = async () => {
    try {
      setLoadingMetas(true)
      const res = await api.get('/metas')
      if (res.data.success) {
        const list = res.data.data || []
        const count = list.filter((m: any) => m.status.toLowerCase() === 'proposta').length
        setMetasCount(count)
      } else {
        setMetasCount(0)
      }
    } catch (err) {
      console.error('Erro ao buscar metas pendentes:', err)
      setMetasCount(null)
    } finally {
      setLoadingMetas(false)
    }
  }

  const refreshAll = () => {
    fetchChamados()
    fetchSensores()
    fetchMetas()
  }

  useEffect(() => {
    refreshAll()
  }, [])

  return (
    <div className="dashboard-container">
      <div className="units-header-actions" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="dashboard-title">Painel de Operações</h1>
          <p className="dashboard-subtitle">
            Gerenciamento de chamados técnicos, estoque de sensores e avaliação de limites sugeridos.
          </p>
        </div>

        <button 
          className="btn-secondary" 
          onClick={refreshAll}
          title="Atualizar painel"
          style={{ padding: '10px' }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="metrics-grid">
        {/* Card de Chamados Pendentes */}
        <div 
          className="kpi-card" 
          onClick={() => navigate('/operador/chamados')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-card-header">
            <span className="kpi-title">Chamados Pendentes</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-700)' }}>
              <Wrench size={20} />
            </div>
          </div>
          {loadingChamados ? (
            <div style={{ height: '36px', display: 'flex', alignItems: 'center' }}><Spinner size="sm" /></div>
          ) : chamadosCount === null ? (
            <div style={{ fontSize: '14px', color: 'var(--red-500)', fontWeight: '500' }}>Erro ao carregar</div>
          ) : (
            <div className="kpi-value">{chamadosCount}</div>
          )}
          <div className="kpi-footer">Chamados aguardando triagem ou perícia técnica.</div>
        </div>

        {/* Card de Sensores Disponíveis */}
        <div 
          className="kpi-card" 
          onClick={() => navigate('/operador/sensores')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-card-header">
            <span className="kpi-title">Sensores em Estoque</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-700)' }}>
              <Radio size={20} />
            </div>
          </div>
          {loadingSensores ? (
            <div style={{ height: '36px', display: 'flex', alignItems: 'center' }}><Spinner size="sm" /></div>
          ) : sensoresCount === null ? (
            <div style={{ fontSize: '14px', color: 'var(--red-500)', fontWeight: '500' }}>Erro ao carregar</div>
          ) : (
            <div className="kpi-value">{sensoresCount}</div>
          )}
          <div className="kpi-footer">Sensores livres e disponíveis para instalação física.</div>
        </div>

        {/* Card de Metas Propostas */}
        <div 
          className="kpi-card" 
          onClick={() => navigate('/operador/metas')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-card-header">
            <span className="kpi-title">Metas para Avaliar</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-700)' }}>
              <Target size={20} />
            </div>
          </div>
          {loadingMetas ? (
            <div style={{ height: '36px', display: 'flex', alignItems: 'center' }}><Spinner size="sm" /></div>
          ) : metasCount === null ? (
            <div style={{ fontSize: '14px', color: 'var(--red-500)', fontWeight: '500' }}>Erro ao carregar</div>
          ) : (
            <div className="kpi-value">{metasCount}</div>
          )}
          <div className="kpi-footer">Limites propostos por clientes aguardando parecer técnico.</div>
        </div>
      </div>
    </div>
  )
}
