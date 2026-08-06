'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Eye, FileText, Layout } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'

interface PageItem {
  id: string
  title: string
  slug: string
  type: string
  status: string
  description?: string
  createdAt: string
  updatedAt: string
}

const typeLabels: Record<string, string> = {
  landing: 'Landing Page',
  page: 'Pagina',
  store: 'Tienda',
  blog: 'Blog',
  checkout: 'Checkout',
}

export default function PagesPage() {
  const router = useRouter()
  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => { fetchPages() }, [])

  async function fetchPages() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/pages?limit=100')
      if (res.ok) {
        const data = await res.json()
        setPages(data.data?.items || [])
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(page: PageItem) {
    if (!confirm(`Eliminar "${page.title}"?`)) return
    try {
      await fetch(`/api/v1/pages/${page.id}`, { method: 'DELETE' })
      fetchPages()
    } catch { alert('Error al eliminar') }
  }

  async function handleTogglePublish(page: PageItem) {
    const newStatus = page.status === 'published' ? 'draft' : 'published'
    try {
      await fetch(`/api/v1/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchPages()
    } catch { alert('Error al actualizar') }
  }

  function handleEdit(page: PageItem) {
    router.push(`/builder/${page.id}`)
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">Pages</h2>
          <p className="text-sm text-[var(--color-text-tertiary)]">{pages.length} paginas</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
          Nueva Pagina
        </Button>
      </div>

      {loading && <TableSkeleton rows={4} columns={4} />}

      {!loading && pages.length === 0 && (
        <EmptyState
          icon={<Layout size={24} />}
          title="No hay paginas"
          description="Crea la primera pagina para tu sitio web"
          action={{ label: 'Nueva Pagina', onClick: () => setShowCreateModal(true) }}
        />
      )}

      {!loading && pages.length > 0 && (
        <div className="space-y-3 stagger-children">
          {pages.map((page) => (
            <div key={page.id} className="surface-card p-4 group cursor-pointer" onClick={() => handleEdit(page)}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                      {page.title}
                    </h3>
                    <Badge variant={page.status === 'published' ? 'success' : 'warning'}>
                      {page.status === 'published' ? 'Publicado' : 'Borrador'}
                    </Badge>
                    <Badge variant="neutral">{typeLabels[page.type] || page.type}</Badge>
                  </div>
                  {page.description && (
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1 line-clamp-1">{page.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-tertiary)]">
                    <span className="font-mono">/{page.slug}</span>
                    <span>Actualizado: {new Date(page.updatedAt).toLocaleDateString('es-PE')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleTogglePublish(page)}
                    className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded-lg transition-colors"
                    title={page.status === 'published' ? 'Despublicar' : 'Publicar'}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleEdit(page)}
                    className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(page)}
                    className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePageModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => { setShowCreateModal(false); router.push(`/builder/${id}`) }}
        />
      )}
    </div>
  )
}

function CreatePageModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ title: '', type: 'landing', description: '', templateId: '' })
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; description: string; industry: string }>>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/v1/templates')
      .then(res => res.json())
      .then(data => setTemplates(data.data?.items || []))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('El titulo es requerido'); return; }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/v1/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, type: form.type, description: form.description,
          templateId: form.templateId || undefined,
          businessId: '00000000-0000-0000-0000-000000000001',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        onCreated(data.data.id)
      } else {
        const data = await res.json()
        setError(data.error || 'Error al crear')
      }
    } catch { setError('Error de conexion') }
    finally { setSaving(false) }
  }

  return (
    <Modal open={true} onClose={onClose} title="Nueva Pagina" size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button loading={saving} onClick={handleSubmit as any}>Crear</Button>
        </>
      }>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titulo"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Mi nueva pagina"
          autoFocus
        />
        <div>
          <label className="form-label">Tipo</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="select-field">
            <option value="landing">Landing Page</option>
            <option value="page">Pagina</option>
            <option value="store">Tienda</option>
            <option value="blog">Blog</option>
          </select>
        </div>
        <div>
          <label className="form-label">Template (opcional)</label>
          <select value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })} className="select-field">
            <option value="">Sin template (empezar de cero)</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name} — {t.industry}</option>
            ))}
          </select>
          {form.templateId && (
            <p className="form-hint">Se creara la pagina con los bloques y configuracion del template seleccionado.</p>
          )}
        </div>
        <div>
          <label className="form-label">Descripcion (opcional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Breve descripcion de la pagina"
            rows={2}
            className="textarea-field"
          />
        </div>
        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  )
}
