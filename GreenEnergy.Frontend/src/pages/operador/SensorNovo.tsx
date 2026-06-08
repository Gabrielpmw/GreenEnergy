import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Radio, Save } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

export const SensorNovo: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [modeloSensor, setModeloSensor] = useState('')
  const [numeroSerie, setNumeroSerie] = useState('')
  const [observacao, setObservacao] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!modeloSensor.trim() || !numeroSerie.trim()) {
      addToast('Por favor, preencha todos os campos obrigatórios.', 'warning')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await api.post('/sensores', {
        modeloSensor: modeloSensor.trim(),
        numeroSerie: numeroSerie.trim(),
        observacao: observacao.trim() || null
      })

      if (res.data.success) {
        addToast('Sensor físico cadastrado com sucesso no estoque!', 'success')
        navigate('/operador/sensores')
      } else {
        addToast(res.data.message || 'Erro ao cadastrar sensor.', 'error')
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar sensor:', err)
      const msg = err.response?.data?.message || 'Falha ao processar cadastro do sensor. Verifique se o número de série é único.'
      addToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="dashboard-container">
      {/* Botão Voltar */}
      <button 
        className="btn-secondary" 
        onClick={() => navigate('/operador/sensores')} 
        style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ArrowLeft size={16} /> Voltar ao Estoque
      </button>

      <div className="form-card" style={{ maxWidth: '600px' }}>
        <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Radio size={20} color="var(--green-700)" />
          Cadastrar Novo Sensor Físico
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Modelo do Sensor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-900)' }}>
                Modelo do Sensor *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: SmartMeter v2, GreenMeasure Pro"
                value={modeloSensor}
                onChange={(e) => setModeloSensor(e.target.value)}
                required
                disabled={isSubmitting}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--white-dim)',
                  backgroundColor: 'var(--white-pure)',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Número de Série */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-900)' }}>
                Número de Série *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: SN-9283-X102, ME-38192-A"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                required
                disabled={isSubmitting}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--white-dim)',
                  backgroundColor: 'var(--white-pure)',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Comentários / Observações */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-900)' }}>
                Comentários / Observações
              </label>
              <textarea
                className="form-input"
                placeholder="Ex: Recomendado para análises detalhadas."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--white-dim)',
                  backgroundColor: 'var(--white-pure)',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => navigate('/operador/sensores')}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isSubmitting ? <Spinner size="sm" color="white" /> : <Save size={16} />}
                Cadastrar Sensor
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
