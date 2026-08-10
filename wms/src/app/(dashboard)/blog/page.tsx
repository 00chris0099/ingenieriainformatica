'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Edit, Trash2, Eye, Newspaper, FolderOpen, Search, ExternalLink, Calendar, MessageSquare, Tag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Toggle } from '@/components/ui/Toggle'
import { TableSkeleton } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import ImageUploadField from '@/components/builder/ImageUploadField'

interface Business { id: string; name: string; slug: string }
interface BlogCategory { id: string; name: string; slug: string; description?: string; businessId?: string; _count?: { posts: number } }
interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  content: string
  tags: string[]
  category?: string | null
  isPublished: boolean
  viewCount: number
  metaTitle?: string | null
  metaDescription?: string | null
  publishedAt?: string | null
  updatedAt: string
  business?: { id: string; name: string; slug: string } | null
  blogCategory?: { id: string; name: string } | null
}

const emptyPost = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  tags: '',
  categoryId: '',
  businessId: '',
  isPublished: false,
  metaTitle: '',
  metaDescription: '',
}

export default function BlogManagerPage() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || ''
  const isStaff = ['super_admin', 'admin'].includes(userRole)

  const [tab, setTab] = useState<'posts' | 'categories'>('posts')
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [bizFilter, setBizFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyPost })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [catName, setCatName] = useState('')
  const [catDesc, setCatDesc] = useState('')
  const [catError, setCatError] = useState('')
  const [deleting, setDeleting] = useState<{ type: 'post' | 'cat'; id: string; name: string } | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [postsRes, catsRes, bizRes] = await Promise.all([
        fetch('/api/v1/blog/posts?limit=100'),
        fetch('/api/v1/blog/categories?limit=100'),
        fetch('/api/v1/businesses'),
      ])
      if (postsRes.ok) {
        const d = await postsRes.json()
        setPosts(Array.isArray(d.data) ? d.data : [])
      }
      if (catsRes.ok) {
        const d = await catsRes.json()
        setCategories(Array.isArray(d.data) ? d.data : [])
      }
      if (bizRes.ok) {
        const d = await bizRes.json()
        const items = Array.isArray(d.data) ? d.data : []
        setBusinesses(items)
        // Un cliente siempre tendrá tiendas asignadas; el staff ve todas
        if (items.length === 1) setBizFilter(items[0].id)
      }
    } catch (e) {
      console.error('[BLOG] fetch error', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Artículos ────────────────────────────────────────────────────────────
  const filteredPosts = posts.filter((p) => {
    if (search && !`${p.title} ${p.excerpt || ''} ${p.tags?.join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false
    if (catFilter && p.blogCategory?.id !== catFilter && p.category !== catFilter) return false
    if (bizFilter && p.business?.id !== bizFilter) return false
    return true
  })

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyPost, businessId: businesses.length === 1 ? businesses[0]?.id || '' : '' })
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(p: BlogPost) {
    setEditingId(p.id)
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || '',
      content: p.content || '',
      coverImage: p.coverImage || '',
      tags: (p.tags || []).join(', '),
      categoryId: p.blogCategory?.id || '',
      businessId: p.business?.id || '',
      isPublished: p.isPublished,
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
    })
    setFormError('')
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { setFormError('El título es requerido'); return }
    if (!form.content.trim()) { setFormError('El contenido es requerido'); return }
    setSaving(true)
    setFormError('')
    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/v1/blog/posts/${editingId}` : '/api/v1/blog/posts'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug || undefined,
          excerpt: form.excerpt,
          content: form.content,
          coverImage: form.coverImage,
          tags: form.tags,
          categoryId: form.categoryId || undefined,
          businessId: form.businessId || undefined,
          isPublished: form.isPublished,
          metaTitle: form.metaTitle,
          metaDescription: form.metaDescription,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setFormError(data?.error || `Error (${res.status})`); return }
      setModalOpen(false)
      fetchAll()
    } catch {
      setFormError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublish(p: BlogPost) {
    try {
      await fetch(`/api/v1/blog/posts/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !p.isPublished }),
      })
      fetchAll()
    } catch { /* silent */ }
  }

  async function handleDeletePost() {
    if (!deleting || deleting.type !== 'post') return
    try {
      await fetch(`/api/v1/blog/posts/${deleting.id}`, { method: 'DELETE' })
      fetchAll()
    } catch { /* silent */ }
    setDeleting(null)
  }

  // ── Categorías ───────────────────────────────────────────────────────────
  async function handleAddCategory() {
    if (!catName.trim()) { setCatError('El nombre es requerido'); return }
    setCatError('')
    try {
      const res = await fetch('/api/v1/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName.trim(), description: catDesc, businessId: businesses.length === 1 ? businesses[0]?.id : undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setCatError(data?.error || 'Error'); return }
      setCatName('')
      setCatDesc('')
      fetchAll()
    } catch { setCatError('Error de conexión') }
  }

  async function handleDeleteCategory() {
    if (!deleting || deleting.type !== 'cat') return
    try {
      await fetch(`/api/v1/blog/categories/${deleting.id}`, { method: 'DELETE' })
      fetchAll()
    } catch { /* silent */ }
    setDeleting(null)
  }

  const catBusiness = (c: BlogCategory) => businesses.find((b) => b.id === c.businessId)

  return (
    <div className="space-y-5 pb-20 lg:pb-0 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader
          title="Gestor de Blog & Artículos"
          description="Publica artículos optimizados para SEO en tus páginas corporativas — URL pública /blog/[slug] con datos estructurados Article"
        />
        <Button icon={<Plus size={16} />} onClick={openCreate}>
          Nuevo Artículo
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl border surface-card w-fit">
        <button
          onClick={() => setTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === 'posts' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
          style={tab === 'posts' ? { background: 'var(--color-bg-selected)' } : undefined}
        >
          <Newspaper size={14} /> Artículos ({posts.length})
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === 'categories' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
          style={tab === 'categories' ? { background: 'var(--color-bg-selected)' } : undefined}
        >
          <FolderOpen size={14} /> Categorías ({categories.length})
        </button>
      </div>

      {tab === 'posts' && (
        <>
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar artículos por título, extracto o etiqueta…"
                className="input-field pl-9"
              />
            </div>
            {categories.length > 0 && (
              <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="md:w-56">
                <option value="">Todas las categorías</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
            {isStaff && businesses.length > 1 && (
              <Select value={bizFilter} onChange={(e) => setBizFilter(e.target.value)} className="md:w-56">
                <option value="">Todas las tiendas</option>
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            )}
          </div>

          {loading && <TableSkeleton rows={4} columns={4} />}

          {!loading && filteredPosts.length === 0 && (
            <EmptyState
              icon={<Newspaper size={28} />}
              title={posts.length === 0 ? 'Aún no hay artículos' : 'Sin resultados para tu búsqueda'}
              description={posts.length === 0 ? 'Crea tu primer artículo para alimentar el blog de tus páginas corporativas (bloque "Artículos / Blog")' : 'Prueba con otros términos o filtros'}
              action={posts.length === 0 ? { label: 'Crear Primer Artículo', onClick: openCreate } : undefined}
            />
          )}

          {!loading && filteredPosts.length > 0 && (
            <div className="space-y-2.5">
              {filteredPosts.map((p) => (
                <div key={p.id} className="surface-card p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                  {p.coverImage && (
                    <img src={p.coverImage} alt="" className="w-full md:w-28 h-20 md:h-16 rounded-xl object-cover shrink-0 bg-white" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[var(--color-text-primary)] truncate">{p.title}</h3>
                      <Badge variant={p.isPublished ? 'success' : 'warning'}>
                        {p.isPublished ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-[var(--color-text-tertiary)] mt-0.5">/blog/{p.slug}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[var(--color-text-tertiary)] flex-wrap">
                      {p.blogCategory && (
                        <span className="inline-flex items-center gap-1"><Tag size={11} /> {p.blogCategory.name}</span>
                      )}
                      {p.business && <span>{p.business.name}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(p.publishedAt || p.updatedAt).toLocaleDateString('es-PE')}
                      </span>
                      <span className="inline-flex items-center gap-1"><Eye size={11} /> {p.viewCount} vistas</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                      title="Ver en público"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => handleTogglePublish(p)}
                      className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all"
                      style={{ borderColor: 'var(--color-border)' }}
                      title={p.isPublished ? 'Despublicar' : 'Publicar'}
                    >
                      {p.isPublished ? 'Despublicar' : 'Publicar'}
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 text-[var(--color-accent)] hover:bg-[var(--color-accent-muted)] rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setDeleting({ type: 'post', id: p.id, name: p.title })}
                      className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] rounded-lg hover:bg-[var(--color-error-muted)] transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'categories' && (
        <div className="space-y-4">
          {/* Crear categoría */}
          <div className="surface-card p-4 flex flex-col md:flex-row gap-2 md:items-end">
            <div className="flex-1">
              <Input label="Nombre de la categoría" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Ej: Guías, Novedades, Casos de éxito" />
            </div>
            <div className="flex-1">
              <Input label="Descripción (opcional)" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} placeholder="De qué trata esta categoría" />
            </div>
            <Button icon={<Plus size={15} />} onClick={handleAddCategory}>Crear Categoría</Button>
            {catError && <p className="text-[11px] text-[var(--color-error)] md:absolute">{catError}</p>}
          </div>

          {categories.length === 0 ? (
            <EmptyState
              icon={<FolderOpen size={28} />}
              title="No hay categorías"
              description="Crea categorías para organizar los artículos de tu blog (Guías, Novedades, Casos de éxito…)"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((c) => (
                <div key={c.id} className="surface-card p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FolderOpen size={15} className="text-[var(--color-accent)] shrink-0" />
                      <h4 className="text-sm font-bold text-[var(--color-text-primary)] truncate">{c.name}</h4>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1 font-mono">/{c.slug}</p>
                    {c.description && <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1 line-clamp-2">{c.description}</p>}
                    <p className="text-[11px] mt-2 text-[var(--color-text-tertiary)]">
                      {c._count?.posts ?? 0} artículo{(c._count?.posts ?? 0) !== 1 ? 's' : ''}
                      {catBusiness(c) ? ` · ${catBusiness(c)!.name}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleting({ type: 'cat', id: c.id, name: c.name })}
                    className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] rounded-lg hover:bg-[var(--color-error-muted)] transition-colors shrink-0"
                    title="Eliminar categoría"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Artículo */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Artículo' : 'Nuevo Artículo de Blog'}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button loading={saving} icon={saving ? undefined : <MessageSquare size={15} />} onClick={handleSave}>
              {saving ? 'Guardando…' : editingId ? 'Guardar Cambios' : 'Crear Artículo'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <p className="text-xs font-semibold text-[var(--color-error)] bg-[var(--color-error-muted)]/40 border border-[var(--color-error)]/30 rounded-xl px-3 py-2">{formError}</p>}

          <Input label="Título del artículo *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Cómo elegir el proveedor ideal para tu negocio" autoFocus />
          <Input label="Slug (URL)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Se genera automáticamente desde el título" hint={`URL pública: /blog/${form.slug || 'tu-slug'}`} />
          <Textarea label="Extracto (resumen)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Resumen corto que aparece en las tarjetas del blog y en el SEO" />
          <Textarea label="Contenido *" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} placeholder="Escribe el cuerpo del artículo… (soporta texto plano con saltos de línea)" />
          <ImageUploadField label="Imagen de portada" value={form.coverImage} onChange={(url) => setForm({ ...form, coverImage: url })} hint="Sube desde tu dispositivo o pega una URL" previewClass="h-24 w-full object-cover" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Categoría" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Tienda" value={form.businessId} onChange={(e) => setForm({ ...form, businessId: e.target.value })} disabled={!isStaff && businesses.length <= 1}>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>

          <Input label="Etiquetas (separadas por coma)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="SEO, marketing, guías" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Meta Título (SEO)" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} placeholder={form.title || 'Se genera desde el título'} />
            <Input label="Meta Descripción (SEO)" value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} placeholder={form.excerpt || 'Se genera desde el extracto'} />
          </div>

          <div className="p-3 rounded-xl border border-[var(--color-border)]">
            <Toggle
              label="Publicar artículo"
              description={form.isPublished ? 'Visible públicamente en /blog/[slug]' : 'Guardado como borrador, no visible en público'}
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
          </div>
        </div>
      </Modal>

      {deleting && (
        <Modal open onClose={() => setDeleting(null)} title={deleting.type === 'post' ? 'Eliminar artículo' : 'Eliminar categoría'} size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>Cancelar</Button>
              <Button variant="danger" onClick={deleting.type === 'post' ? handleDeletePost : handleDeleteCategory} icon={<Trash2 size={15} />}>
                Eliminar
              </Button>
            </>
          }
        >
          <p className="text-sm text-[var(--color-text-secondary)]">
            {deleting.type === 'post'
              ? `¿Eliminar permanentemente el artículo "${deleting.name}"? Esta acción no se puede deshacer.`
              : `¿Eliminar la categoría "${deleting.name}"? Los artículos de esta categoría quedarán sin categoría.`}
          </p>
        </Modal>
      )}
    </div>
  )
}
