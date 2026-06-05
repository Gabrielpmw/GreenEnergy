import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Plus, Cpu, Info } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

// Máscara de CEP (XXXXX-XXX)
const formatCep = (value: string) => {
  const nums = value.replace(/\D/g, '')
  if (nums.length <= 5) {
    return nums
  }
  return `${nums.substring(0, 5)}-${nums.substring(5, 8)}`
}

interface Address {
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
}

interface Unit {
  id: number
  tipoImovel: string
  cep: string
  cidade: string
  estado: string
  endereco: Address
}

interface Device {
  id: number
  unidadeConsumidoraId: number
  nome: string
  tipoAparelho: string
  potenciaWatts: number
  status: string
  categoriaNome: string
}

export const UnidadeDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  
  const numeroRef = useRef<HTMLInputElement>(null)

  const [unit, setUnit] = useState<Unit | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Estados de edição de endereço
  const [isEditing, setIsEditing] = useState(false)
  const [cep, setCep] = useState('')
  const [tipoImovel, setTipoImovel] = useState('0')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  const [isCepLoading, setIsCepLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [cepWarning, setCepWarning] = useState<string | null>(null)

  // Modal de desativação
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false)

  useEffect(() => {
    const fetchUnitAndDevices = async () => {
      try {
        setIsLoading(true)
        setErrorMsg(null)

        const unitRes = await api.get(`/unidades/${id}`)
        if (unitRes.data.success) {
          setUnit(unitRes.data.value || unitRes.data.data)
        } else {
          setErrorMsg('Não foi possível carregar os detalhes desta unidade.')
        }

        const devicesRes = await api.get('/dispositivos')
        if (devicesRes.data.success) {
          const allDevices: Device[] = devicesRes.data.data || []
          const unitDevices = allDevices.filter(d => d.unidadeConsumidoraId === Number(id))
          setDevices(unitDevices)
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes da unidade:', err)
        setErrorMsg('Erro de conexão com o servidor.')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchUnitAndDevices()
    }
  }, [id])

  // Busca CEP automático em modo de edição
  useEffect(() => {
    if (isEditing) {
      const cleanedCep = cep.replace(/\D/g, '')
      if (cleanedCep.length === 8) {
        const fetchAddress = async () => {
          try {
            setIsCepLoading(true)
            setEditError(null)
            setCepWarning(null)
            const res = await api.get(`/unidades/cep/${cleanedCep}`)
            if (res.data.success && res.data.data) {
              const data = res.data.data
              if (data.erro) {
                setCepWarning('CEP não localizado. Preencha manualmente.')
                addToast('CEP não localizado.', 'warning')
                return
              }
              setLogradouro(data.logradouro || '')
              setBairro(data.bairro || '')
              setCidade(data.localidade || '')
              setEstado(data.uf || '')
              addToast('Endereço localizado!', 'success')
              
              setTimeout(() => {
                numeroRef.current?.focus()
              }, 100)
            } else {
              setCepWarning('CEP não localizado. Preencha manualmente.')
            }
          } catch (err) {
            console.error('Erro ao buscar CEP:', err)
            setCepWarning('ViaCEP indisponível. Preencha manualmente.')
            addToast('Não foi possível consultar o CEP automaticamente.', 'warning')
          } finally {
            setIsCepLoading(false)
          }
        }
        fetchAddress()
      } else {
        setCepWarning(null)
      }
    }
  }, [cep, isEditing])

  const formatCepDisplay = (cepRaw: string) => {
    const cleaned = cepRaw.replace(/\D/g, '')
    if (cleaned.length === 8) {
      return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
    }
    return cepRaw
  }

  const handleStartEditing = () => {
    if (unit) {
      setCep(formatCepDisplay(unit.cep))
      const typeMap: { [key: string]: string } = { 'Casa': '0', 'Apartamento': '1', 'Comercial': '2' }
      setTipoImovel(typeMap[unit.tipoImovel] || '0')
      setLogradouro(unit.endereco?.logradouro || '')
      setNumero(unit.endereco?.numero || '')
      setComplemento(unit.endereco?.complemento || '')
      setBairro(unit.endereco?.bairro || '')
      setCidade(unit.cidade || '')
      setEstado(unit.estado || '')
      
      setEditError(null)
      setCepWarning(null)
      setIsEditing(true)
    }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)

    const cleanedCep = cep.replace(/\D/g, '')
    if (cleanedCep.length !== 8) {
      setEditError('Por favor, informe um CEP válido.')
      return
    }

    if (!numero.trim() || !logradouro.trim() || !bairro.trim() || !cidade.trim() || !estado.trim()) {
      setEditError('Por favor, preencha todos os campos obrigatórios do endereço.')
      return
    }

    try {
      setIsSaving(true)
      const payload = {
        cep: cleanedCep,
        tipoImovel: parseInt(tipoImovel, 10),
        numero,
        complemento: complemento.trim() || null,
        logradouro,
        bairro,
        cidade,
        uf: estado
      }

      const res = await api.put(`/unidades/${id}`, payload)
      if (res.data.success) {
        addToast('Endereço atualizado com sucesso!', 'success')
        setUnit(res.data.value || res.data.data)
        setIsEditing(false)
      } else {
        setEditError(res.data.message || 'Erro ao atualizar o endereço.')
      }
    } catch (err: any) {
      console.error(err)
      setEditError(err.response?.data?.message || 'Erro na comunicação com o servidor.')
    } finally {
      setIsSaving(false)
    }
  }



  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (errorMsg || !unit) {
    return (
      <div className="dashboard-container">
        <button onClick={() => navigate('/cliente/unidades')} className="btn-secondary" style={{ marginBottom: '20px' }}>
          <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Voltar
        </button>
        <div className="toast toast-error" style={{ position: 'relative', right: 0, bottom: 0 }}>
          <span className="toast-message">{errorMsg || 'Unidade consumidora não localizada.'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <button 
          onClick={() => navigate('/cliente/unidades')} 
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '6px 12px' }}
        >
          <ArrowLeft size={14} />
          Voltar para Unidades
        </button>
        <h1 className="dashboard-title">Unidade Consumidora #{unit.id}</h1>
        <p className="dashboard-subtitle">Informações de endereço e dispositivos inteligentes vinculados.</p>
      </header>

      <div className="unit-detail-grid">
        {/* Lado Esquerdo: Dados do Endereço */}
        <div className="unit-info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--green-900)' }}>
            <Home size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
              {isEditing ? 'Editar Endereço' : 'Endereço Registrado'}
            </h3>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {editError && (
                <div className="toast toast-error" style={{ position: 'relative', right: 0, bottom: 0, margin: 0, minWidth: 'auto' }}>
                  <span className="toast-message" style={{ fontSize: '13px' }}>{editError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="cep">CEP *</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    id="cep"
                    type="text"
                    className="form-input"
                    placeholder="00000-000"
                    maxLength={9}
                    value={cep}
                    onChange={(e) => setCep(formatCep(e.target.value))}
                    disabled={isSaving || isCepLoading}
                    required
                  />
                  {isCepLoading && <Spinner size="sm" />}
                </div>
                {cepWarning && (
                  <div style={{ fontSize: '12px', color: 'var(--amber-400)', marginTop: '4px', fontWeight: '500' }}>
                    {cepWarning}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="tipo-imovel">Tipo do Imóvel *</label>
                <select
                  id="tipo-imovel"
                  className="form-input"
                  value={tipoImovel}
                  onChange={(e) => setTipoImovel(e.target.value)}
                  disabled={isSaving}
                  required
                >
                  <option value="0">Casa</option>
                  <option value="1">Apartamento</option>
                  <option value="2">Comercial</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="logradouro">Logradouro *</label>
                <input
                  id="logradouro"
                  type="text"
                  className="form-input"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="numero">Número *</label>
                <input
                  id="numero"
                  type="text"
                  className="form-input"
                  placeholder="Ex: 123 ou S/N"
                  ref={numeroRef}
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="complemento">Complemento</label>
                <input
                  id="complemento"
                  type="text"
                  className="form-input"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bairro">Bairro *</label>
                <input
                  id="bairro"
                  type="text"
                  className="form-input"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cidade">Cidade *</label>
                <input
                  id="cidade"
                  type="text"
                  className="form-input"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="estado">Estado (UF) *</label>
                <input
                  id="estado"
                  type="text"
                  className="form-input"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSaving || isCepLoading}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  {isSaving ? <Spinner size="sm" /> : 'Salvar'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: '600' }}>Tipo de Imóvel</span>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`unit-type-badge ${unit.tipoImovel.toLowerCase()}`}>
                      {unit.tipoImovel}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: '600' }}>Logradouro</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: 'var(--gray-900)' }}>
                    {unit.endereco?.logradouro || 'Não informado'}, {unit.endereco?.numero || 'S/N'}
                  </p>
                  {unit.endereco?.complemento && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: 'var(--gray-500)' }}>
                      Complemento: {unit.endereco.complemento}
                    </p>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: '600' }}>Bairro</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: 'var(--gray-900)' }}>
                    {unit.endereco?.bairro || 'Não informado'}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: '600' }}>Cidade / Estado</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: 'var(--gray-900)' }}>
                    {unit.cidade} / {unit.estado}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: '600' }}>CEP</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: 'var(--gray-900)' }}>
                    {formatCepDisplay(unit.cep)}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--white-muted)' }}>
                <button 
                  onClick={handleStartEditing} 
                  className="btn-primary"
                  style={{ width: '100%' }}
                >
                  Editar Endereço
                </button>
                <button 
                  onClick={() => setIsDeactivateModalOpen(true)} 
                  className="btn-danger"
                  style={{ width: '100%' }}
                >
                  Desativar Unidade
                </button>
              </div>
            </>
          )}
        </div>

        {/* Lado Direito: Lista de Aparelhos / Dispositivos */}
        <div className="unit-devices-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green-900)' }}>
              <Cpu size={20} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Aparelhos Vinculados</h3>
            </div>
            
            <button 
              className="btn-primary"
              onClick={() => navigate('/cliente/dispositivos/novo', { state: { unitId: unit.id } })}
              style={{ padding: '6px 12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} />
              Adicionar Aparelho
            </button>
          </div>

          {devices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--white-muted)', borderRadius: 'var(--radius-lg)' }}>
              <Info size={32} color="var(--gray-500)" style={{ marginBottom: '12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--gray-900)', margin: '0 0 8px 0' }}>
                Nenhum aparelho vinculado
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--gray-500)', margin: '0 0 20px 0', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
                Cadastre seus aparelhos eletrodomésticos para esta unidade para começar a mensurar os consumos.
              </p>
            </div>
          ) : (
            <div className="device-item-list">
              {devices.map((device) => (
                <div 
                  key={device.id} 
                  className="device-row-item"
                  onClick={() => navigate(`/cliente/dispositivos/${device.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="device-item-meta">
                    <div className="device-icon-container">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <span className="device-text-title">{device.nome}</span>
                      <div className="device-text-power">
                        {device.categoriaNome} — {device.potenciaWatts}W
                      </div>
                    </div>
                  </div>

                  <StatusBadge 
                    status={device.status} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeactivateModalOpen}
        title={devices.length > 0 ? "Aparelhos Cadastrados" : "Solicitar Desativação"}
        message={
          devices.length > 0
            ? "Não é possível desativar esta unidade consumidora pois existem dispositivos cadastrados nela. É necessário primeiramente abrir um chamado para a retirada dos sensores registrados aos dispositivos da casa."
            : "Para desativar uma unidade consumidora, é necessário abrir um chamado técnico de desativação ou solicitar a um administrador/operador do sistema."
        }
        confirmText="Abrir Chamado"
        cancelText="Voltar"
        onConfirm={() => {
          setIsDeactivateModalOpen(false)
          navigate('/cliente/chamados/novo')
        }}
        onCancel={() => setIsDeactivateModalOpen(false)}
      />
    </div>
  )
}
