import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Radio, ArrowLeft, Plus, FileText, CheckCircle, Play } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import api from '../../services/api'
import { formatDate } from '../../utils/format'

interface Chamado {
  id: number
  clienteId: number
  clienteNome: string
  operadorId?: number
  operadorNome?: string
  dispositivoId: number
  dispositivoNome: string
  tipo: string
  status: string
  descricao: string
  criadoEm: string
}

interface Sensor {
  id: number
  modeloSensor: string
  numeroSerie: string
  status: string
}

interface Relatorio {
  id: number
  chamadoId: number
  operadorNome: string
  descricao: string
  solucaoRecomendada: string
  tipoOcorrencia: string
  criadoEm: string
}

export const ChamadoDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [chamado, setChamado] = useState<Chamado | null>(null)
  const [loading, setLoading] = useState(true)
  const [sensoresDisponiveis, setSensoresDisponiveis] = useState<Sensor[]>([])
  const [selectedSensorId, setSelectedSensorId] = useState<string>('')
  
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [loadingRelatorios, setLoadingRelatorios] = useState(true)
  
  // Form para novo relatório
  const [relatorioDescricao, setRelatorioDescricao] = useState('')
  const [relatorioSolucao, setRelatorioSolucao] = useState('')
  const [relatorioOcorrencia, setRelatorioOcorrencia] = useState('0') // Padrão: Falha do Sensor (0)
  const [submittingRelatorio, setSubmittingRelatorio] = useState(false)

  // Modais de confirmação
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showProvisionarModal, setShowProvisionarModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchChamado = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/chamados/${id}`)
      if (res.data.success) {
        setChamado(res.data.data)
      } else {
        addToast(res.data.message || 'Erro ao carregar chamado.', 'error')
      }
    } catch (err: any) {
      console.error('Erro ao buscar chamado:', err)
      const errMsg = err.response?.data?.message || 'Erro ao carregar os detalhes do chamado.'
      addToast(errMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchSensoresDisponiveis = async () => {
    try {
      const res = await api.get('/sensores/disponiveis')
      if (res.data.success) {
        setSensoresDisponiveis(res.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao buscar sensores disponíveis:', err)
    }
  }

  const fetchRelatorios = async () => {
    try {
      setLoadingRelatorios(true)
      const res = await api.get(`/relatorios/chamado/${id}`)
      if (res.data.success) {
        setRelatorios(res.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao buscar relatórios:', err)
    } finally {
      setLoadingRelatorios(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchChamado()
      fetchRelatorios()
      fetchSensoresDisponiveis()
    }
  }, [id])

  const handleIniciarAnalise = async () => {
    try {
      setActionLoading(true)
      const res = await api.patch(`/chamados/${id}/status`, { status: 1 }) // EmAnalise
      if (res.data.success) {
        addToast('Atendimento iniciado com sucesso!', 'success')
        setChamado(res.data.data)
      } else {
        addToast(res.data.message || 'Erro ao iniciar análise.', 'error')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Não foi possível atualizar o status do chamado.'
      addToast(msg, 'error')
    } finally {
      setActionLoading(false)
      setShowStatusModal(false)
    }
  }

  const handleConcluirChamado = async () => {
    try {
      setActionLoading(true)
      const res = await api.patch(`/chamados/${id}/status`, { status: 2 }) // Validado
      if (res.data.success) {
        addToast('Chamado finalizado e validado com sucesso!', 'success')
        setChamado(res.data.data)
      } else {
        addToast(res.data.message || 'Erro ao concluir chamado.', 'error')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Não foi possível concluir o chamado.'
      addToast(msg, 'error')
    } finally {
      setActionLoading(false)
      setShowStatusModal(false)
    }
  }

  const handleProvisionarSensor = async () => {
    if (!selectedSensorId) {
      addToast('Selecione um sensor válido no estoque.', 'warning')
      return
    }
    try {
      setActionLoading(true)
      const res = await api.post(`/chamados/${id}/provisionar`, { sensorId: parseInt(selectedSensorId) })
      if (res.data.success) {
        addToast('Sensor provisionado e instalado com sucesso!', 'success')
        setChamado(res.data.data)
        fetchSensoresDisponiveis()
      } else {
        addToast(res.data.message || 'Erro ao provisionar sensor.', 'error')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Não foi possível provisionar o sensor.'
      addToast(msg, 'error')
    } finally {
      setActionLoading(false)
      setShowProvisionarModal(false)
    }
  }

  const handleCriarRelatorio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (relatorioDescricao.trim().length < 10) {
      addToast('A descrição do problema deve conter no mínimo 10 caracteres.', 'warning')
      return
    }
    if (relatorioSolucao.trim().length < 10) {
      addToast('A solução recomendada deve conter no mínimo 10 caracteres.', 'warning')
      return
    }
    try {
      setSubmittingRelatorio(true)
      const res = await api.post('/relatorios', {
        chamadoId: parseInt(id!),
        descricao: relatorioDescricao.trim(),
        solucaoRecomendada: relatorioSolucao.trim(),
        tipoOcorrencia: parseInt(relatorioOcorrencia)
      })
      if (res.data.success) {
        addToast('Relatório técnico adicionado!', 'success')
        setRelatorioDescricao('')
        setRelatorioSolucao('')
        setRelatorioOcorrencia('0')
        fetchRelatorios()
      } else {
        addToast(res.data.message || 'Erro ao criar relatório.', 'error')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Não foi possível cadastrar o relatório técnico.'
      addToast(msg, 'error')
    } finally {
      setSubmittingRelatorio(false)
    }
  }

  const translateTipo = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'instalacao':
        return 'Instalação de Sensor'
      case 'remocao':
        return 'Remoção de Dispositivo'
      case 'manutencao':
        return 'Manutenção Técnica'
      default:
        return tipo
    }
  }

  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente':
        return 'Pendente'
      case 'emanalise':
        return 'Em Análise'
      case 'validado':
        return 'Finalizado'
      default:
        return status
    }
  }

  const getOcorrenciaLabel = (ocorrenciaStr: string) => {
    switch (ocorrenciaStr) {
      case 'FalhaSensor': return 'Falha do Sensor'
      case 'ExcessoConsumo': return 'Excesso de Consumo'
      case 'ManutencaoRecomendada': return 'Manutenção Recomendada'
      default: return ocorrenciaStr
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!chamado) {
    return (
      <div className="dashboard-container">
        <button className="btn-secondary" onClick={() => navigate('/operador/chamados')} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Voltar à Lista
        </button>
        <div className="empty-state">
          <p>Chamado não encontrado ou sem permissão de acesso.</p>
        </div>
      </div>
    )
  }

  const isPendente = chamado.status.toLowerCase() === 'pendente'
  const isEmAnalise = chamado.status.toLowerCase() === 'emanalise' || chamado.status.toLowerCase() === 'ematendimento'
  const isValidado = chamado.status.toLowerCase() === 'validado'

  return (
    <div className="dashboard-container">
      {/* Botão Voltar */}
      <button 
        className="btn-secondary" 
        onClick={() => navigate('/operador/chamados')} 
        style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ArrowLeft size={16} /> Voltar à Fila de Chamados
      </button>

      {/* Grid de Detalhes */}
      <div className="unit-detail-grid">
        {/* Lado Esquerdo: Resumo do Chamado */}
        <div className="unit-info-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
              Detalhes da Solicitação
            </h2>
            <StatusBadge status={chamado.status} label={translateStatus(chamado.status)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--gray-900)' }}>
            <div>
              <span style={{ color: 'var(--gray-500)' }}>ID do Chamado:</span>{' '}
              <strong>#{chamado.id}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--gray-500)' }}>Tipo:</span>{' '}
              <strong>{translateTipo(chamado.tipo)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--gray-500)' }}>Cliente Solicitante:</span>{' '}
              <strong>{chamado.clienteNome}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--gray-500)' }}>Aparelho Vinculado:</span>{' '}
              <strong>{chamado.dispositivoNome}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--gray-500)' }}>Data de Abertura:</span>{' '}
              <strong>{formatDate(chamado.criadoEm)}</strong>
            </div>
            {chamado.operadorNome && (
              <div>
                <span style={{ color: 'var(--gray-500)' }}>Técnico Responsável:</span>{' '}
                <strong style={{ color: 'var(--green-700)' }}>{chamado.operadorNome}</strong>
              </div>
            )}
          </div>

          <div style={{ 
            marginTop: '20px', 
            padding: '16px', 
            backgroundColor: 'var(--white-soft)', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '13.5px',
            borderLeft: '3px solid var(--green-700)',
            lineHeight: '1.4'
          }}>
            <strong style={{ color: 'var(--gray-900)' }}>Descrição do Cliente:</strong>
            <p style={{ margin: '8px 0 0 0', color: 'var(--gray-500)' }}>{chamado.descricao}</p>
          </div>

          {/* Fluxo de Ações do Operador */}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--white-muted)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '12px' }}>
              Ações Disponíveis
            </h3>

            {isPendente && (
              <button 
                className="btn-primary" 
                onClick={() => setShowStatusModal(true)} 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={actionLoading}
              >
                <Play size={16} /> Iniciar Atendimento
              </button>
            )}

            {isEmAnalise && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {chamado.tipo.toLowerCase() === 'instalacao' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-500)' }}>
                      Selecionar Sensor do Estoque
                    </label>
                    <select
                      value={selectedSensorId}
                      onChange={(e) => setSelectedSensorId(e.target.value)}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--white-dim)',
                        backgroundColor: 'var(--white-pure)',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Selecione um Sensor Disponível</option>
                      {sensoresDisponiveis.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.modeloSensor} — S/N: {s.numeroSerie}
                        </option>
                      ))}
                    </select>

                    <button 
                      className="btn-primary" 
                      onClick={() => setShowProvisionarModal(true)}
                      style={{ marginTop: '4px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      disabled={!selectedSensorId || actionLoading}
                    >
                      <Radio size={16} /> Provisionar Sensor e Concluir
                    </button>
                  </div>
                ) : chamado.tipo.toLowerCase() === 'remocao' ? (
                  <div>
                    <div style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fef3c7',
                      color: '#b45309',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      marginBottom: '12px',
                      lineHeight: '1.4'
                    }}>
                      ⚠️ <strong>Atenção:</strong> Ao finalizar este chamado, o dispositivo inteligente será **inativado permanentemente** (soft delete) e desvinculado de qualquer sensor no sistema.
                    </div>
                    <button 
                      className="btn-danger" 
                      onClick={() => setShowStatusModal(true)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      disabled={actionLoading}
                    >
                      <CheckCircle size={16} /> Concluir Chamado e Desativar
                    </button>
                  </div>
                ) : (
                  <button 
                    className="btn-primary" 
                    onClick={() => setShowStatusModal(true)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={16} /> Concluir Manutenção
                  </button>
                )}
              </div>
            )}

            {isValidado && (
              <div style={{ textAlign: 'center', padding: '12px', color: 'var(--green-700)', fontWeight: '600', fontSize: '14px', backgroundColor: 'var(--green-50)', borderRadius: 'var(--radius-md)' }}>
                ✓ Chamado Concluído e Validado
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Laudos e Relatórios Técnicos */}
        <div className="unit-devices-card">
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} style={{ color: 'var(--green-700)' }} /> Laudos Técnicos / Histórico
          </h2>

          {/* Lista de Relatórios */}
          {loadingRelatorios ? (
            <div style={{ padding: '20px 0', textAlign: 'center' }}><Spinner size="md" /></div>
          ) : relatorios.length === 0 ? (
            <div style={{
              fontSize: '13px',
              color: 'var(--gray-500)',
              backgroundColor: 'var(--white-soft)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              Nenhum laudo técnico emitido para este chamado até o momento.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {relatorios.map((r) => (
                <div key={r.id} style={{
                  padding: '16px',
                  backgroundColor: 'var(--white-soft)',
                  border: '1px solid var(--white-muted)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
                    <strong style={{ color: 'var(--green-900)' }}>Resp: {r.operadorNome}</strong>
                    <span style={{ color: 'var(--gray-500)' }}>
                      {formatDate(r.criadoEm)}
                    </span>
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <span className="unit-type-badge residencial" style={{ fontSize: '10px', textTransform: 'none' }}>
                      {getOcorrenciaLabel(r.tipoOcorrencia)}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--gray-900)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <span style={{ fontWeight: '600', color: 'var(--gray-500)' }}>Descrição: </span>
                      <span>{r.descricao}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: '600', color: 'var(--gray-500)' }}>Solução: </span>
                      <span>{r.solucaoRecomendada}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form de Criação de Relatório (Se em atendimento ou finalizado) */}
          {!isPendente && (
            <form onSubmit={handleCriarRelatorio} style={{ borderTop: '1px solid var(--white-muted)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Emitir Novo Laudo Técnico
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)' }}>Tipo de Ocorrência</label>
                  <select
                    value={relatorioOcorrencia}
                    onChange={(e) => setRelatorioOcorrencia(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-dim)',
                      backgroundColor: 'var(--white-pure)',
                      fontSize: '13px'
                    }}
                  >
                    <option value="0">Falha do Sensor</option>
                    <option value="1">Excesso de Consumo</option>
                    <option value="2">Manutenção Recomendada</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)' }}>Descrição do Problema *</label>
                  <textarea
                    rows={3}
                    value={relatorioDescricao}
                    onChange={(e) => setRelatorioDescricao(e.target.value)}
                    placeholder="Descreva a ocorrência ou problema identificado no chamado..."
                    required
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-dim)',
                      backgroundColor: 'var(--white-pure)',
                      fontSize: '13px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)' }}>Solução Recomendada *</label>
                  <textarea
                    rows={3}
                    value={relatorioSolucao}
                    onChange={(e) => setRelatorioSolucao(e.target.value)}
                    placeholder="Descreva a intervenção realizada ou a solução proposta..."
                    required
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-dim)',
                      backgroundColor: 'var(--white-pure)',
                      fontSize: '13px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-secondary"
                  disabled={submittingRelatorio}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {submittingRelatorio ? <Spinner size="sm" /> : 'Salvar Laudo Técnico'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Modal Confirmar Alteração de Status */}
      <ConfirmModal
        isOpen={showStatusModal}
        title={isPendente ? 'Iniciar Atendimento?' : 'Concluir Chamado?'}
        message={
          isPendente 
            ? 'Deseja iniciar a análise técnica deste chamado? Isso atribuirá você como responsável técnico pelo chamado.'
            : chamado.tipo.toLowerCase() === 'remocao'
              ? 'Deseja realmente confirmar a conclusão da remoção? O aparelho inteligente associado será desativado permanentemente no sistema.'
              : 'Deseja confirmar a conclusão e resolução técnica deste chamado?'
        }
        onConfirm={isPendente ? handleIniciarAnalise : handleConcluirChamado}
        onCancel={() => setShowStatusModal(false)}
        confirmText={isPendente ? 'Iniciar' : 'Concluir'}
        isDestructive={!isPendente && chamado.tipo.toLowerCase() === 'remocao'}
      />

      {/* Modal Confirmar Provisionamento de Sensor */}
      <ConfirmModal
        isOpen={showProvisionarModal}
        title="Provisionar e Instalar Sensor?"
        message="Deseja vincular o sensor selecionado ao dispositivo inteligente do cliente e concluir este chamado de instalação?"
        onConfirm={handleProvisionarSensor}
        onCancel={() => setShowProvisionarModal(false)}
        confirmText="Confirmar Provisionamento"
      />
    </div>
  )
}
