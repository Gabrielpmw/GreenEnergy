import React, { useEffect, useState } from 'react'
import { Tags, Plus, RefreshCw, Edit2, Trash2, Save, X } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

interface Categoria {
  id: number
  nome: string
  descricao?: string
  iconeUrl?: string
}

export const Categorias: React.FC = () => {
  const { addToast } = useToast()
  
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Estados do Formulário (Nova / Edição)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Controle de Modal de Exclusão
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const fetchCategorias = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/categorias')
      if (res.data.success) {
        setCategorias(res.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao buscar categorias:', err)
      addToast('Erro ao carregar categorias de aparelhos.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  const handleOpenNew = () => {
    setEditingId(null)
    setNome('')
    setDescricao('')
    setIsFormOpen(true)
  }

  const handleOpenEdit = (c: Categoria) => {
    setEditingId(c.id)
    setNome(c.nome)
    setDescricao(c.descricao || '')
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setNome('')
    setDescricao('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nome.trim().length < 3 || nome.trim().length > 50) {
      addToast('O nome da categoria deve ter entre 3 e 50 caracteres.', 'warning')
      return
    }

    try {
      setIsSubmitting(true)
      if (editingId) {
        // UPDATE
        const res = await api.put(`/categorias/${editingId}`, {
          nome: nome.trim(),
          descricao: descricao.trim() || null
        })

        if (res.data.success) {
          addToast('Categoria atualizada com sucesso!', 'success')
          setCategorias(prev => 
            prev.map(c => c.id === editingId ? res.data.data : c)
          )
          handleCloseForm()
        } else {
          addToast(res.data.message || 'Erro ao atualizar categoria.', 'error')
        }
      } else {
        // CREATE
        const res = await api.post('/categorias', {
          nome: nome.trim(),
          descricao: descricao.trim() || null
        })

        if (res.data.success) {
          addToast('Nova categoria criada com sucesso!', 'success')
          setCategorias(prev => [...prev, res.data.data])
          handleCloseForm()
        } else {
          addToast(res.data.message || 'Erro ao criar categoria.', 'error')
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao salvar a categoria de aparelhos.'
      addToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDelete = (id: number) => {
    setDeletingId(id)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingId) return
    try {
      const res = await api.delete(`/categorias/${deletingId}`)
      if (res.data.success) {
        addToast('Categoria excluída/desativada com sucesso.', 'success')
        setCategorias(prev => prev.filter(c => c.id !== deletingId))
      } else {
        addToast(res.data.message || 'Erro ao excluir categoria.', 'error')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao desativar categoria. Pode haver aparelhos ativos vinculados.'
      addToast(msg, 'error')
    } finally {
      setIsDeleteOpen(false)
      setDeletingId(null)
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
      <div className="units-header-actions" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="dashboard-title">Categorias de Aparelhos</h1>
          <p className="dashboard-subtitle">Gerencie as categorias de dispositivos elétricos inteligentes do sistema.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-secondary" 
            onClick={fetchCategorias}
            title="Atualizar lista"
            style={{ padding: '10px' }}
          >
            <RefreshCw size={16} />
          </button>
          
          <button 
            className="btn-primary" 
            onClick={handleOpenNew}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Nova Categoria
          </button>
        </div>
      </div>

      {categorias.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria cadastrada"
          description="Nenhuma categoria de aparelhos inteligentes foi cadastrada no ecossistema até o momento."
          actionText="Cadastrar Categoria"
          onAction={handleOpenNew}
          icon={<Tags size={48} color="var(--green-700)" />}
        />
      ) : (
        <div style={{
          backgroundColor: 'var(--white-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--white-muted)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--white-soft)', borderBottom: '1px solid var(--white-muted)', color: 'var(--gray-500)', fontWeight: '600' }}>
                <th style={{ padding: '16px' }}>Nome</th>
                <th style={{ padding: '16px' }}>Descrição</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--white-muted)' }}>
                  <td style={{ padding: '16px', fontWeight: '600', color: 'var(--gray-900)' }}>
                    {c.nome}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--gray-500)' }}>
                    {c.descricao || 'Sem descrição.'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => handleOpenEdit(c)}
                        style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit2 size={12} /> Editar
                      </button>

                      <button
                        className="btn-secondary"
                        onClick={() => handleOpenDelete(c.id)}
                        style={{ padding: '6px 10px', color: 'var(--red-500)', borderColor: '#fee2e2', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal / Sidebar Form para cadastro/edição */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <h3 className="modal-title">
              {editingId ? 'Editar Categoria' : 'Nova Categoria de Aparelho'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                
                {/* Nome */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)' }}>
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Ar Condicionado, Iluminação, Motores"
                    disabled={isSubmitting}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-dim)',
                      backgroundColor: 'var(--white-pure)',
                      fontSize: '13px'
                    }}
                  />
                </div>

                {/* Descrição */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)' }}>
                    Descrição (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Dispositivos voltados ao condicionamento térmico..."
                    disabled={isSubmitting}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--white-dim)',
                      backgroundColor: 'var(--white-pure)',
                      fontSize: '13px',
                      resize: 'vertical'
                    }}
                  />
                </div>

              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleCloseForm}
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <X size={14} /> Cancelar
                </button>
                
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting || nome.trim().length < 3}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isSubmitting ? <Spinner size="sm" color="white" /> : <Save size={14} />}
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Deseja realmente excluir a categoria?"
        message="A exclusão inativará esta categoria no sistema. Não deve haver aparelhos ativos associados a ela para que a operação seja efetuada com sucesso pelo banco."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteOpen(false)
          setDeletingId(null)
        }}
        confirmText="Excluir Categoria"
        isDestructive={true}
      />
    </div>
  )
}
