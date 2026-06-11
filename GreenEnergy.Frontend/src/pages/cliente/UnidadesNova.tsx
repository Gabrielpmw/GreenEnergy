import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast'
import { Spinner } from '../../components/ui/Spinner'
import api from '../../services/api'
import { ArrowLeft } from 'lucide-react'

// Máscara de CEP (XXXXX-XXX)
const formatCep = (value: string) => {
  const nums = value.replace(/\D/g, '')
  if (nums.length <= 5) {
    return nums
  }
  return `${nums.substring(0, 5)}-${nums.substring(5, 8)}`
}

export const UnidadesNova: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()
  
  // Refs
  const numeroRef = useRef<HTMLInputElement>(null)

  // Form states
  const [nome, setNome] = useState('')
  const [cep, setCep] = useState('')
  const [tipoImovel, setTipoImovel] = useState('0') // 0 = Casa, 1 = Apartamento, 2 = Comercial
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  // Loading & error states
  const [isCepLoading, setIsCepLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cepWarning, setCepWarning] = useState<string | null>(null)

  // Dispara a consulta de CEP ao completar 8 dígitos numéricos
  useEffect(() => {
    const cleanedCep = cep.replace(/\D/g, '')
    if (cleanedCep.length === 8) {
      consultarCep(cleanedCep)
    } else {
      setCepWarning(null)
    }
  }, [cep])

  const consultarCep = async (cleanedCep: string) => {
    try {
      setIsCepLoading(true)
      setErrorMessage(null)
      setCepWarning(null)

      const res = await api.get(`/unidades/cep/${cleanedCep}`)
      
      if (res.data.success && res.data.data) {
        const addressData = res.data.data
        if (addressData.erro) {
          setCepWarning('CEP não localizado. Preencha o endereço manualmente.')
          addToast('CEP não localizado.', 'warning')
          return
        }

        // Preenche campos automáticos
        setLogradouro(addressData.logradouro || '')
        setBairro(addressData.bairro || '')
        setCidade(addressData.localidade || '')
        setEstado(addressData.uf || '')
        
        addToast('Endereço localizado!', 'success')
        
        // Foca no número do imóvel após um breve timeout para a renderização do estado
        setTimeout(() => {
          numeroRef.current?.focus()
        }, 100)
      } else {
        setCepWarning('CEP não localizado. Preencha o endereço manualmente.')
      }
    } catch (err: any) {
      console.error('Erro ao consultar CEP:', err)
      setCepWarning('ViaCEP indisponível. Preencha o endereço manualmente.')
      addToast('Não foi possível consultar o CEP automaticamente.', 'warning')
    } finally {
      setIsCepLoading(false)
    }
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCep(formatCep(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!nome.trim()) {
      setErrorMessage('Por favor, informe o nome de identificação da unidade.')
      return
    }

    const cleanedCep = cep.replace(/\D/g, '')
    if (cleanedCep.length !== 8) {
      setErrorMessage('Por favor, informe um CEP válido.')
      return
    }

    if (!numero.trim() || !logradouro.trim() || !bairro.trim() || !cidade.trim() || !estado.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios do endereço.')
      return
    }

    try {
      setIsSaving(true)

      const payload = {
        nome: nome.trim(),
        cep: cleanedCep,
        tipoImovel: parseInt(tipoImovel, 10),
        numero,
        complemento: complemento.trim() || null,
        logradouro,
        bairro,
        cidade,
        uf: estado
      }

      const res = await api.post('/unidades', payload)

      if (res.data.success) {
        addToast('Unidade consumidora cadastrada com sucesso!', 'success')
        navigate('/cliente/unidades')
      } else {
        setErrorMessage(res.data.message || 'Erro ao salvar a unidade.')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.response?.data?.message || 'Erro na comunicação com o servidor. Verifique os dados.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header" style={{ maxWidth: '800px', margin: '0 auto 32px auto' }}>
        <button 
          onClick={() => navigate('/cliente/unidades')} 
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '6px 12px' }}
        >
          <ArrowLeft size={14} />
          Voltar
        </button>
        <h1 className="dashboard-title">Cadastrar Unidade Consumidora</h1>
        <p className="dashboard-subtitle">Adicione um novo imóvel para gerenciar seu ecossistema de aparelhos inteligentes.</p>
      </header>

      <div className="form-card">
        {errorMessage && (
          <div className="toast toast-error" style={{ position: 'relative', margin: '0 0 24px 0', right: 0, bottom: 0, minWidth: 'auto' }}>
            <span className="toast-message">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Identificação da Unidade */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="nome">Identificação da Unidade *</label>
            <input
              id="nome"
              type="text"
              className="form-input"
              placeholder="Ex: Minha Casa, Casa da Namorada, Sítio"
              maxLength={100}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isSaving}
              required
            />
          </div>

          <div className="profile-row">
            {/* CEP */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label" htmlFor="cep">CEP *</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  id="cep"
                  type="text"
                  className="form-input"
                  placeholder="00000-000"
                  maxLength={9}
                  value={cep}
                  onChange={handleCepChange}
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

            {/* Tipo Imóvel */}
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
          </div>

          <div className="profile-row">
            {/* Logradouro */}
            <div className="form-group">
              <label className="form-label" htmlFor="logradouro">Logradouro (Rua/Avenida) *</label>
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

            {/* Número */}
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
          </div>

          <div className="profile-row">
            {/* Complemento */}
            <div className="form-group">
              <label className="form-label" htmlFor="complemento">Complemento</label>
              <input
                id="complemento"
                type="text"
                className="form-input"
                placeholder="Apto, Bloco, etc. (Opcional)"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                disabled={isSaving}
              />
            </div>

            {/* Bairro */}
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
          </div>

          <div className="profile-row">
            {/* Cidade */}
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

            {/* Estado */}
            <div className="form-group">
              <label className="form-label" htmlFor="estado">Estado (UF) *</label>
              <input
                id="estado"
                type="text"
                className="form-input"
                placeholder="Ex: SP"
                maxLength={2}
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            disabled={isSaving || isCepLoading}
          >
            {isSaving ? 'Salvando...' : 'Cadastrar Unidade'}
          </button>
        </form>
      </div>
    </div>
  )
}
