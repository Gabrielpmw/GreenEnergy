import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

interface Category {
  id: number
  nome: string
  descricao?: string
}

interface Unit {
  id: number
  nome: string
  tipoImovel: string
  cep: string
  cidade: string
  estado: string
}

export const DispositivoNovo: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Form fields
  const [unidadeId, setUnidadeId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [nome, setNome] = useState('')
  const [tipoAparelho, setTipoAparelho] = useState('')
  const [potenciaWatts, setPotenciaWatts] = useState('')
  const [descricao, setDescricao] = useState('')

  useEffect(() => {
    const fetchFormOptions = async () => {
      try {
        setIsLoading(true)
        const [categoriesRes, unitsRes] = await Promise.all([
          api.get('/categorias'),
          api.get('/unidades')
        ])

        if (categoriesRes.data.success) {
          setCategories(categoriesRes.data.data || [])
        }
        if (unitsRes.data.success) {
          const fetchedUnits = unitsRes.data.data || []
          setUnits(fetchedUnits)
          if (fetchedUnits.length > 0) {
            setUnidadeId(fetchedUnits[0].id.toString())
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados do formulário:', err)
        setErrorMessage('Erro ao buscar opções de cadastro do servidor.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFormOptions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!unidadeId) {
      setErrorMessage('Selecione uma unidade consumidora.')
      return
    }
    if (!categoriaId) {
      setErrorMessage('Selecione a categoria de consumo do aparelho.')
      return
    }
    if (nome.trim().length < 3) {
      setErrorMessage('O nome do aparelho deve conter pelo menos 3 caracteres.')
      return
    }
    if (!tipoAparelho.trim()) {
      setErrorMessage('Informe o tipo de aparelho (ex: Modelo, Marca, etc.).')
      return
    }
    
    const potencia = parseFloat(potenciaWatts)
    if (isNaN(potencia) || potencia <= 0) {
      setErrorMessage('A potência deve ser um número maior que zero.')
      return
    }

    try {
      setIsSaving(true)
      const res = await api.post('/dispositivos', {
        unidadeConsumidoraId: parseInt(unidadeId),
        categoriaId: parseInt(categoriaId),
        nome: nome.trim(),
        tipoAparelho: tipoAparelho.trim(),
        descricao: descricao.trim() || undefined,
        potenciaWatts: potencia
      })

      if (res.data.success) {
        addToast('Aparelho inteligente cadastrado com sucesso!', 'success')
        navigate('/cliente/dispositivos')
      } else {
        setErrorMessage(res.data.message || 'Erro ao cadastrar aparelho.')
      }
    } catch (err: any) {
      console.error('Erro ao salvar dispositivo:', err)
      const msg = err.response?.data?.message || 'Erro de conexão com o servidor. Tente novamente.'
      setErrorMessage(msg)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (units.length === 0) {
    return (
      <div className="dashboard-container">
        <button className="btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="toast toast-warning" style={{ position: 'relative', bottom: 0, right: 0, minWidth: 'auto' }}>
          <span className="toast-icon">
            <AlertTriangle size={18} />
          </span>
          <span className="toast-message">
            Você precisa cadastrar pelo menos uma **Unidade Consumidora** antes de registrar aparelhos inteligentes.
          </span>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => navigate('/cliente/unidades/nova')}
          style={{ marginTop: '16px' }}
        >
          Cadastrar Primeira Unidade
        </button>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: '20px' }}>
        <button className="btn-secondary" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} />
          Voltar
        </button>
      </div>

      <h1 className="dashboard-title">Cadastrar Novo Aparelho</h1>
      <p className="dashboard-subtitle">Vincula um novo dispositivo inteligente a uma das suas unidades de consumo.</p>

      <div className="profile-card" style={{ maxWidth: '600px', marginTop: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {errorMessage && (
            <div className="toast toast-error" style={{ position: 'relative', margin: 0, right: 0, bottom: 0, minWidth: 'auto' }}>
              <span className="toast-icon">
                <AlertTriangle size={18} />
              </span>
              <span className="toast-message">{errorMessage}</span>
            </div>
          )}

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="unidadeId">Unidade Consumidora *</label>
              <select
                id="unidadeId"
                className="form-input"
                value={unidadeId}
                onChange={(e) => setUnidadeId(e.target.value)}
                required
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.nome || `Unidade #${unit.id}`} — {unit.tipoImovel} ({unit.cidade})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="categoriaId">Categoria de Consumo *</label>
              <select
                id="categoriaId"
                className="form-input"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="nome">Nome do Aparelho *</label>
            <input
              type="text"
              id="nome"
              className="form-input"
              placeholder="Ex: Ar Condicionado Suíte, Computador Escritório"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="tipoAparelho">Tipo/Modelo *</label>
              <input
                type="text"
                id="tipoAparelho"
                className="form-input"
                placeholder="Ex: Split 12k BTUs, Geladeira Frost Free"
                value={tipoAparelho}
                onChange={(e) => setTipoAparelho(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="potenciaWatts">Potência Declarada (Watts) *</label>
              <input
                type="number"
                step="0.1"
                id="potenciaWatts"
                className="form-input"
                placeholder="Ex: 1500, 350"
                value={potenciaWatts}
                onChange={(e) => setPotenciaWatts(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="descricao">Descrição Adicional (Opcional)</label>
            <textarea
              id="descricao"
              className="form-input"
              placeholder="Informações adicionais do aparelho como marca, voltagem ou setor físico."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSaving}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isSaving ? <Spinner size="sm" color="white" /> : <Save size={16} />}
              Salvar Aparelho
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
