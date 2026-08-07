'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Eye, FileText, Layout, Sparkles, Wand2, ArrowRight, Layers, CheckCircle2, Bot, Globe, ShieldCheck } from 'lucide-react'
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
  page: 'Página Informativa',
  store: 'Tienda Virtual',
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
        const items = Array.isArray(data.data) ? data.data : Array.isArray(data.data?.items) ? data.data.items : []
        setPages(items)
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(page: PageItem) {
    if (!confirm(`¿Eliminar permanentemente "${page.title}"?`)) return
    try {
      await fetch(`/api/v1/pages/${page.id}`, { method: 'DELETE' })
      fetchPages()
    } catch { alert('Error al eliminar página') }
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
    } catch { alert('Error al actualizar estado') }
  }

  function handleEdit(page: PageItem) {
    router.push(`/builder/${page.id}`)
  }

  return (
    <div className="space-y-5 pb-20 lg:pb-0 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl border surface-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-pink-500 bg-pink-500/10">
              Módulo Enterprise
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            Gestor de Páginas & Tiendas Virtuales
          </h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            {pages.length} proyecto{pages.length !== 1 ? 's' : ''} activo{pages.length !== 1 ? 's' : ''} en la plataforma
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
          Crear Nueva Tienda / Página
        </Button>
      </div>

      {loading && <TableSkeleton rows={4} columns={4} />}

      {!loading && pages.length === 0 && (
        <EmptyState
          icon={<Layout size={28} />}
          title="No hay tiendas o páginas creadas"
          description="Usa las plantillas prediseñadas o la inteligencia artificial para crear tu primera tienda virtual en segundos"
          action={{ label: 'Crear Primera Tienda', onClick: () => setShowCreateModal(true) }}
        />
      )}

      {!loading && pages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {pages.map((page) => (
            <div
              key={page.id}
              className="surface-card p-5 group cursor-pointer hover:border-[var(--color-accent)] hover:shadow-lg transition-all"
              onClick={() => handleEdit(page)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                  <Globe size={18} />
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={page.status === 'published' ? 'success' : 'warning'}>
                    {page.status === 'published' ? 'Publicado' : 'Borrador'}
                  </Badge>
                </div>
              </div>

              <h3 className="text-sm font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors truncate mb-1">
                {page.title}
              </h3>

              <p className="text-xs font-mono text-[var(--color-text-tertiary)] mb-3">
                /{page.slug}
              </p>

              {page.description && (
                <p className="text-xs text-[var(--color-text-tertiary)] line-clamp-2 mb-4">
                  {page.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
                <span>{new Date(page.updatedAt).toLocaleDateString('es-PE')}</span>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleTogglePublish(page)}
                    className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                    title={page.status === 'published' ? 'Despublicar' : 'Publicar'}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleEdit(page)}
                    className="p-1.5 text-[var(--color-accent)] hover:bg-[var(--color-accent-muted)] rounded-lg transition-colors"
                    title="Editar en Diseñador Visual"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(page)}
                    className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] rounded-lg hover:bg-[var(--color-error-muted)] transition-colors"
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
        <CreatePageWizardModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => { setShowCreateModal(false); router.push(`/builder/${id}`) }}
        />
      )}
    </div>
  )
}

function CreatePageWizardModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [creationMode, setCreationMode] = useState<'template' | 'ai' | 'blank'>('template')
  const [form, setForm] = useState({
    title: '',
    type: 'store',
    description: '',
    templateId: 'tpl-adrisu-kids',
    aiIndustry: 'moda',
    aiTone: 'professional',
  })
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; description: string; industry: string }>>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/v1/templates')
      .then(res => res.json())
      .then(data => {
        const items = Array.isArray(data.data) ? data.data : Array.isArray(data.data?.items) ? data.data.items : []
        setTemplates(items)
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const titleToUse = form.title.trim() || (creationMode === 'ai' ? 'Tienda Generada con IA' : 'Nueva Tienda Virtual')

    try {
      let createdPageId = ''

      if (creationMode === 'ai') {
        // AI Generation flow
        const aiRes = await fetch('/api/v1/ai/generate-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: titleToUse,
            businessDescription: form.description || 'Tienda e-commerce con catálogo completo',
            industry: form.aiIndustry,
            tone: form.aiTone,
          }),
        })

        let aiBlocks: any[] = []
        if (aiRes.ok) {
          const aiData = await aiRes.json()
          aiBlocks = aiData.data?.blocks || []
        }

        const pageRes = await fetch('/api/v1/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: titleToUse,
            type: 'store',
            description: form.description || 'Generado automáticamente por IA',
            blocks: aiBlocks,
          }),
        })

        if (pageRes.ok) {
          const data = await pageRes.json()
          createdPageId = data.data.id
        }
      } else {
        // Template or Blank flow
        const pageRes = await fetch('/api/v1/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: titleToUse,
            type: form.type,
            description: form.description,
            templateId: creationMode === 'template' ? form.templateId : undefined,
          }),
        })

        if (pageRes.ok) {
          const data = await pageRes.json()
          createdPageId = data.data.id
        }
      }

      if (createdPageId) {
        onCreated(createdPageId)
      } else {
        setError('No se pudo crear la página. Inténtelo de nuevo.')
      }
    } catch {
      setError('Error de conexión al servidor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Centro de Creación Enterprise de Tiendas & Páginas"
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button loading={saving} onClick={handleSubmit as any} icon={creationMode === 'ai' ? <Sparkles size={15} /> : <ArrowRight size={15} />}>
            {saving
              ? 'Creando Tienda...'
              : creationMode === 'ai'
              ? 'Generar con IA'
              : creationMode === 'template'
              ? 'Crear desde Plantilla'
              : 'Crear Lienzo en Blanco'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Mode Selector */}
        <div>
          <label className="form-label mb-2 block font-bold text-sm">
            Selecciona el Método de Creación
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div
              onClick={() => setCreationMode('template')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                creationMode === 'template'
                  ? 'border-pink-500 bg-pink-500/10 shadow-md'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Layers size={16} className="text-pink-500" />
                <span className="font-extrabold text-xs">Plantillas Pro</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-snug">Moda, Tech o Gourmet listas con catálogo y bloques.</p>
            </div>

            <div
              onClick={() => setCreationMode('ai')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                creationMode === 'ai'
                  ? 'border-purple-500 bg-purple-500/10 shadow-md'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={16} className="text-purple-500" />
                <span className="font-extrabold text-xs">Generador IA</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-snug">Motor Multi-IA genera copys y productos automáticos.</p>
            </div>

            <div
              onClick={() => setCreationMode('blank')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                creationMode === 'blank'
                  ? 'border-blue-500 bg-blue-500/10 shadow-md'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Wand2 size={16} className="text-blue-500" />
                <span className="font-extrabold text-xs">Lienzo en Blanco</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-snug">Diseña desde cero agregando secciones personalizadas.</p>
            </div>
          </div>
        </div>

        {/* Step 2: Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Nombre de la Tienda / Proyecto"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={creationMode === 'template' ? 'Ej: Adrisu Kids Store' : 'Ej: Mi Tienda Online'}
            autoFocus
          />

          <div>
            <label className="form-label">Tipo de Proyecto</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="select-field">
              <option value="store">Tienda Virtual E-Commerce Completa</option>
              <option value="landing">Landing Page de Alta Conversión</option>
              <option value="page">Página Informativa / Corporativa</option>
              <option value="blog">Blog de Noticias / Contenidos</option>
            </select>
          </div>
        </div>

        {/* Step 3: Creation Mode Content */}
        {creationMode === 'template' && (
          <div>
            <label className="form-label mb-2 block font-bold text-sm">
              Selecciona una Plantilla E-Commerce Prediseñada
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
              {templates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setForm({ ...form, templateId: t.id })}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    form.templateId === t.id
                      ? 'border-pink-500 bg-pink-500/5 ring-2 ring-pink-500/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>{t.name}</span>
                      {form.templateId === t.id && <CheckCircle2 size={14} className="text-pink-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-3 mb-2">{t.description}</p>
                  </div>
                  <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-500 w-fit">
                    {t.industry}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {creationMode === 'ai' && (
          <div className="p-4 rounded-2xl border bg-purple-500/5 border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-purple-500" />
              <span className="text-xs font-bold text-purple-500">Motor Multi-IA Activado</span>
            </div>
            <p className="text-xs text-gray-500">
              La IA generará automáticamente el Hero Banner, catálogo de productos con precios, características principales, prueba social y el footer.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label text-xs">Industria / Nicho</label>
                <select value={form.aiIndustry} onChange={(e) => setForm({ ...form, aiIndustry: e.target.value })} className="select-field text-xs">
                  <option value="moda">Moda & Ropa</option>
                  <option value="tecnologia">Tecnología & Gadgets</option>
                  <option value="gastronomia">Gastronomía & Vinos</option>
                  <option value="servicios">Servicios Digitales</option>
                </select>
              </div>
              <div>
                <label className="form-label text-xs">Tono de Comunicación</label>
                <select value={form.aiTone} onChange={(e) => setForm({ ...form, aiTone: e.target.value })} className="select-field text-xs">
                  <option value="professional">Profesional & Elegante</option>
                  <option value="friendly">Cercano & Divertido</option>
                  <option value="urgent">Alta Conversión / Ofertas</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {error && <p className="form-error text-xs font-semibold">{error}</p>}
      </form>
    </Modal>
  )
}
