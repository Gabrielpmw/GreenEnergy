import React, { useEffect, useState } from 'react'
import { RefreshCw, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

interface AuditLog {
  id: number
  usuarioId?: number
  usuarioNome?: string
  usuarioRole?: string
  acao: string
  entidade: string
  entidadeId: string
  dadosAnteriores?: string
  dadosNovos?: string
  ip?: string
  timestamp: string
}

export const Auditoria: React.FC = () => {
  const { addToast } = useToast()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filtros
  const [usuarioRole, setUsuarioRole] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [acao, setAcao] = useState('')
  const [entidade, setEntidade] = useState('')

  // Linhas Expandidas (IDs dos logs que estão abertos)
  const [expandedLogIds, setExpandedLogIds] = useState<Set<number>>(new Set())

  const fetchLogs = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      else setIsRefreshing(true)

      const params: Record<string, string> = {}
      if (usuarioRole) params.usuarioRole = usuarioRole
      if (startDate) params.startDate = new Date(startDate).toISOString()
      if (endDate) {
        // Define o horário para o fim do dia para abranger a data inteira
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        params.endDate = end.toISOString()
      }
      if (acao.trim()) params.acao = acao.trim()
      if (entidade.trim()) params.entidade = entidade.trim()

      const res = await api.get('/auditoria', { params })
      if (res.data.success) {
        setLogs(res.data.data || [])
      } else {
        addToast(res.data.message || 'Erro ao carregar logs de auditoria.', 'error')
      }
    } catch (err: any) {
      console.error('Erro ao buscar logs de auditoria:', err)
      addToast('Erro ao carregar logs do servidor.', 'error')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLogs()
  }

  const handleClearFilters = () => {
    setUsuarioRole('')
    setStartDate('')
    setEndDate('')
    setAcao('')
    setEntidade('')
    // Limpa os filtros no estado e recarrega
    setTimeout(() => {
      fetchLogs()
    }, 50)
  }

  const toggleExpandLog = (id: number) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Exportar dados atuais em formato CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      addToast('Nenhum log para exportar.', 'warning')
      return
    }

    try {
      const headers = ['ID', 'Data/Hora', 'Usuario ID', 'Usuario Nome', 'Perfil', 'Acao', 'Entidade', 'ID Entidade', 'Dados Anteriores', 'Dados Novos']
      const rows = logs.map((log) => {
        const dateStr = new Date(log.timestamp).toLocaleString('pt-BR')
        
        // Escape quotes inside fields to keep CSV valid
        const escapeCSV = (str?: string) => {
          if (!str) return '""'
          return `"${str.replace(/"/g, '""')}"`
        }

        return [
          log.id,
          escapeCSV(dateStr),
          log.usuarioId || '',
          escapeCSV(log.usuarioNome),
          escapeCSV(log.usuarioRole),
          escapeCSV(log.acao),
          escapeCSV(log.entidade),
          escapeCSV(log.entidadeId),
          escapeCSV(log.dadosAnteriores),
          escapeCSV(log.dadosNovos)
        ]
      })

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.setAttribute('href', url)
      link.setAttribute('download', `auditoria_greenenergy_${new Date().toISOString().slice(0,10)}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      addToast('Relatório de auditoria exportado com sucesso!', 'success')
    } catch (err) {
      console.error('Erro ao gerar CSV:', err)
      addToast('Erro ao gerar relatório CSV.', 'error')
    }
  }

  // Formatar JSON String de forma legível
  const formatJson = (jsonStr?: string) => {
    if (!jsonStr) return '—'
    try {
      const parsed = JSON.parse(jsonStr)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return jsonStr
    }
  }

  const getRoleBadgeStyle = (role?: string) => {
    if (!role) return { backgroundColor: '#f3f4f6', color: '#374151' }
    switch (role.toLowerCase()) {
      case 'admin':
        return { backgroundColor: '#f3e8ff', color: '#6b21a8' }
      case 'operador':
        return { backgroundColor: '#dbeafe', color: '#1e40af' }
      case 'cliente':
        return { backgroundColor: '#dcfce7', color: '#166534' }
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' }
    }
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="units-header-actions" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="dashboard-title">Logs de Auditoria</h1>
          <p className="dashboard-subtitle">Registro centralizado de todas as operações e modificações de estado realizadas no ecossistema.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            title="Atualizar lista"
            style={{ padding: '10px' }}
          >
            {isRefreshing ? <Spinner size="sm" /> : <RefreshCw size={16} />}
          </button>
          
          <button
            className="btn-primary"
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Painel de Filtros */}
      <div className="form-card" style={{ margin: '0 0 24px 0', padding: '20px' }}>
        <form onSubmit={handleApplyFilters} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px'
          }}>
            {/* Perfil */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-900)' }}>Perfil do Usuário</label>
              <select
                value={usuarioRole}
                onChange={(e) => setUsuarioRole(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--white-dim)',
                  backgroundColor: 'var(--white-pure)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="">Todos</option>
                <option value="Admin">Admin</option>
                <option value="Operador">Operador</option>
                <option value="Cliente">Cliente</option>
              </select>
            </div>

            {/* Ação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-900)' }}>Ação</label>
              <select
                value={acao}
                onChange={(e) => setAcao(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--white-dim)',
                  backgroundColor: 'var(--white-pure)',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">Todas</option>
                <option value="Criar">Criar</option>
                <option value="Atualizar">Atualizar</option>
                <option value="Desativar">Desativar</option>
                <option value="Criar Operador">Criar Operador</option>
                <option value="Atualizar Operador">Atualizar Operador</option>
                <option value="Atualizar Perfil Próprio">Atualizar Perfil Próprio</option>
                <option value="Reativar Usuário">Reativar Usuário</option>
                <option value="Desativar Usuário (Soft Delete)">Desativar Usuário</option>
                <option value="Criar Tarifa">Criar Tarifa</option>
                <option value="Alterar Status Tarifa">Alterar Status Tarifa</option>
                <option value="AtualizarStatus">Atualizar Status</option>
                <option value="VincularSensor">Vincular Sensor</option>
                <option value="DesvincularSensor">Desvincular Sensor</option>
                <option value="LimitarConsumo">Limitar Consumo</option>
                <option value="CortarEnergia">Cortar Energia</option>
                <option value="RestaurarEnergia">Restaurar Energia</option>
                <option value="Criar Configuração API">Criar Configuração API</option>
                <option value="Atualizar Configuração API">Atualizar Configuração API</option>
                <option value="Remover Configuração API">Remover Configuração API</option>
                <option value="ProvisionarSensor">Provisionar Sensor</option>
                <option value="Autocadastro de Cliente">Autocadastro de Cliente</option>
                <option value="Avaliar">Avaliar</option>
                <option value="Finalizar">Finalizar</option>
              </select>
            </div>

            {/* Entidade */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-900)' }}>Entidade</label>
              <select
                value={entidade}
                onChange={(e) => setEntidade(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--white-dim)',
                  backgroundColor: 'var(--white-pure)',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">Todas</option>
                <option value="Usuario">Usuário</option>
                <option value="UnidadeConsumidora">Unidade Consumidora</option>
                <option value="Tarifa">Tarifa</option>
                <option value="Sensor">Sensor</option>
                <option value="RelatorioTecnico">Relatório Técnico</option>
                <option value="Meta">Meta</option>
                <option value="Dispositivo">Dispositivo</option>
                <option value="ConfiguracaoAPI">Configuração API</option>
                <option value="Chamado">Chamado</option>
                <option value="CategoriaAparelho">Categoria Aparelho</option>
              </select>
            </div>

            {/* Data Inicial */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-900)' }}>Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--white-dim)',
                  backgroundColor: 'var(--white-pure)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Data Final */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-900)' }}>Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--white-dim)',
                  backgroundColor: 'var(--white-pure)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Botões Ação Filtro */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClearFilters}
              style={{ padding: '8px 16px' }}
            >
              Limpar Filtros
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '8px 16px' }}
            >
              Buscar Logs
            </button>
          </div>
        </form>
      </div>

      {/* Listagem de Logs */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Spinner size="lg" />
        </div>
      ) : logs.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: 'var(--white-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--white-muted)',
          color: 'var(--gray-500)'
        }}>
          Nenhum registro de auditoria corresponde aos filtros aplicados.
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--white-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--white-muted)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--white-soft)', borderBottom: '1px solid var(--white-muted)', color: 'var(--gray-500)', fontWeight: '600' }}>
                <th style={{ padding: '16px', width: '40px' }}></th>
                <th style={{ padding: '16px' }}>Data/Hora</th>
                <th style={{ padding: '16px' }}>Usuário</th>
                <th style={{ padding: '16px' }}>Perfil</th>
                <th style={{ padding: '16px' }}>Ação</th>
                <th style={{ padding: '16px' }}>Entidade (ID)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isExpanded = expandedLogIds.has(log.id)
                return (
                  <React.Fragment key={log.id}>
                    <tr 
                      style={{ 
                        borderBottom: isExpanded ? 'none' : '1px solid var(--white-muted)',
                        cursor: 'pointer',
                        transition: 'background-color var(--transition-fast)'
                      }}
                      onClick={() => toggleExpandLog(log.id)}
                      className="audit-row"
                    >
                      {/* Ícone Expandir */}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '16px', color: 'var(--gray-900)' }}>
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>

                      {/* Usuário */}
                      <td style={{ padding: '16px', fontWeight: '500', color: 'var(--gray-900)' }}>
                        {log.usuarioNome || `ID: ${log.usuarioId || 'Worker/Sist.'}`}
                      </td>

                      {/* Perfil */}
                      <td style={{ padding: '16px' }}>
                        <span 
                           style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            borderRadius: 'var(--radius-full)',
                            ...getRoleBadgeStyle(log.usuarioRole)
                          }}
                        >
                          {log.usuarioRole || 'Sistema'}
                        </span>
                      </td>

                      {/* Ação */}
                      <td style={{ padding: '16px', color: 'var(--gray-900)', fontWeight: '500' }}>
                        {log.acao}
                      </td>

                      {/* Entidade */}
                      <td style={{ padding: '16px', color: 'var(--gray-900)' }}>
                        <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{log.entidade}</span>
                        <code style={{ marginLeft: '6px', fontSize: '12px', padding: '2px 6px', backgroundColor: 'var(--white-soft)', borderRadius: '4px' }}>
                          #{log.entidadeId}
                        </code>
                      </td>
                    </tr>

                    {/* Diffs/JSON Expandidos */}
                    {isExpanded && (
                      <tr style={{ borderBottom: '1px solid var(--white-muted)', backgroundColor: 'var(--white-soft)' }}>
                        <td colSpan={6} style={{ padding: '16px 24px' }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '24px',
                            marginTop: '4px'
                          }}>
                            {/* Dados Anteriores */}
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--red-500)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FileText size={14} /> Dados Anteriores (Antes da Alteração)
                              </div>
                              <pre style={{
                                padding: '12px',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: '#fffafb',
                                border: '1px solid #fee2e2',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                color: '#991b1b',
                                overflowX: 'auto',
                                margin: '0',
                                maxHeight: '250px'
                              }}>
                                {formatJson(log.dadosAnteriores)}
                              </pre>
                            </div>

                            {/* Dados Novos */}
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--green-700)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FileText size={14} /> Dados Novos (Estado Modificado)
                              </div>
                              <pre style={{
                                padding: '12px',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--green-50)',
                                border: '1px solid var(--green-300)',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                color: 'var(--green-900)',
                                overflowX: 'auto',
                                margin: '0',
                                maxHeight: '250px'
                              }}>
                                {formatJson(log.dadosNovos)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
