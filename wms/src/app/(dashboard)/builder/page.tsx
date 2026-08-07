'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Wand2, FileText, Eye, Edit3, Loader2, Trash2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface PageItem {
  id: string
  title: string
  slug: string
  type: string
  status: string
  updatedAt: string
}

export default function BuilderIndexPage() {
  const router = useRouter()
  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/v1/pages?limit=50')
      .then(r => r.json())
      .then(d => {
        const items = Array.isArray(d.data) ? d.data : Array.isArray(d.data?.items) ? d.data.items : []
        setPages(items)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function createBlank() {
    setCreating(true)
    try {
      const res = await fetch('/api/v1/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nueva Página', type: 'landing' }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/builder/${data.data.id}`)
      }
    } catch {}
    setCreating(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Diseñador Visual</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>Selecciona una página para editar o crea una nueva</p>
        </div>
        <Button icon={<Plus size={16} />} loading={creating} onClick={createBlank}>
          Nueva Página
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
        </div>
      )}

      {!loading && pages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
          <Wand2 className="w-10 h-10 mb-3 opacity-40" />
          <p className="font-medium text-sm">No hay páginas todavía</p>
          <p className="text-xs mt-1 mb-4">Crea tu primera página para comenzar a diseñar</p>
          <Button size="sm" loading={creating} onClick={createBlank}>Crear Primera Página</Button>
        </div>
      )}

      {!loading && pages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pages.map(page => (
            <div
              key={page.id}
              onClick={() => router.push(`/builder/${page.id}`)}
              className="group surface-card p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent-muted)' }}>
                  <FileText className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                </div>
                <Badge variant={page.status === 'published' ? 'success' : 'warning'}>
                  {page.status === 'published' ? 'Publicado' : 'Borrador'}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm mb-1 group-hover:text-[var(--color-accent)] transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                {page.title}
              </h3>
              <p className="text-xs font-mono mb-3" style={{ color: 'var(--color-text-tertiary)' }}>/{page.slug}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  <Clock className="w-3 h-3" />
                  <span>{new Date(page.updatedAt).toLocaleDateString('es-PE')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); window.open(`/${page.slug}`, '_blank') }}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-hover)]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    title="Ver página"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/builder/${page.id}`) }}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-accent-muted)]"
                    style={{ color: 'var(--color-accent)' }}
                    title="Editar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
