'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Search, Filter, Download, Loader2, ChevronDown, Plus, X, MessageSquare,
  Phone, Mail, UserCheck, Star, Target, CheckCircle2, XCircle, Eye, Pencil, Trash2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import Link from 'next/link'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Nuevo', color: '#6b7280', bg: '#f3f4f6' },
  contacted: { label: 'Contactado', color: '#2563eb', bg: '#dbeafe' },
  qualified: { label: 'Calificado', color: '#7c3aed', bg: '#ede9fe' },
  won: { label: 'Ganado', color: '#059669', bg: '#d1fae5' },
  lost: { label: 'Perdido', color: '#dc2626', bg: '#fee2e2' },
}

const ALL_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost']

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table')
  const [editingTags, setEditingTags] = useState<{ id: string; tags: string[] } | null>(null)
  const [notesModal, setNotesModal] = useState<{ id: string; notes: string } | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchLeads = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('limit', String(limit))
      if (search) params.set('q', search)
      if (statusFilter) params.set('status', statusFilter)
      if (businessId) params.set('businessId', businessId)

      const res = await fetch(`/api/v1/leads?${params}`)
      if (res.ok) {
        const json = await res.json()
        setLeads(json.data?.leads || [])
        setTotal(json.data?.total || 0)
        setStats(json.data?.stats || {})
      }
    } catch (e) {
      console.error('[LEADS]', e)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter, businessId])

  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/businesses')
      if (res.ok) {
        const json = await res.json()
        setBusinesses(Array.isArray(json.data) ? json.data : [])
      }
    } catch {}
  }, [])

  useEffect(() => { fetchLeads(); fetchBusinesses() }, [fetchLeads, fetchBusinesses])

  const updateLead = async (id: string, data: any) => {
    setUpdating(id)
    try {
      await fetch(`/api/v1/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      fetchLeads()
    } catch {}
    finally { setUpdating(null) }
  }

  const deleteLead = async (id: string) => {
    if (!confirm('¿Eliminar este lead?')) return
    setUpdating(id)
    try {
      await fetch(`/api/v1/leads/${id}`, { method: 'DELETE' })
      fetchLeads()
    } catch {}
    finally { setUpdating(null) }
  }

  const totalPages = Math.ceil(total / limit)
  const hasStaffBusinesses = businesses.length > 1

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
            <Users size={20} style={{ color: 'var(--color-accent)' }} />
            Leads & CRM
          </h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Prospectos capturados desde tus landings y bloques de contacto — convierte cada lead en cliente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => fetchLeads()} icon={<RefreshCw size={13} />}>Actualizar</Button>
          <Button variant="secondary" size="sm" icon={<Download size={13} />}
            onClick={() => {
              const params = new URLSearchParams()
              if (search) params.set('q', search)
              if (statusFilter) params.set('status', statusFilter)
              if (businessId) params.set('businessId', businessId)
              window.open(`/api/v1/leads/export?${params}`, '_blank')
            }}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => { setStatusFilter(''); setPage(1) }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${!statusFilter ? 'text-white shadow-sm' : 'text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'}`}
          style={!statusFilter ? { backgroundColor: 'var(--color-accent)' } : {}}
        >
          Todos ({total})
        </button>
        {ALL_STATUSES.map((st) => {
          const m = STATUS_META[st]!
          const count = stats[st] || 0
          return (
            <button key={st} onClick={() => { setStatusFilter(st === statusFilter ? '' : st); setPage(1) }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === st ? 'ring-2 ring-offset-1' : 'border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'}`}
              style={{ backgroundColor: m.bg, color: m.color }}
            >
              {m.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="surface-card p-3 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar por nombre, email, teléfono..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leftIcon={<Search size={14} />}
          />
        </div>
        {hasStaffBusinesses && (
          <div className="w-56">
            <Select value={businessId} onChange={(e) => { setBusinessId(e.target.value); setPage(1) }}>
              <option value="">Todas las tiendas</option>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'}`}
          >
            Tabla
          </button>
          <button onClick={() => setViewMode('pipeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'pipeline' ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'}`}
          >
            Pipeline
          </button>
        </div>
      </div>

      {loading && <TableSkeleton rows={8} columns={5} />}

      {!loading && leads.length === 0 && (
        <EmptyState icon={<Users size={26} />}
          title="No hay leads aún"
          description="Cuando alguien envíe un formulario de contacto desde una landing page de tu tienda, aparecerá aquí. También puedes crear leads manualmente."
        />
      )}

      {!loading && leads.length > 0 && (
        <>
          {viewMode === 'pipeline' ? (
            <div className="grid grid-cols-5 gap-3 overflow-x-auto">
              {ALL_STATUSES.map((st) => {
                const m = STATUS_META[st]!
                const columnLeads = leads.filter((l) => l.status === st)
                return (
                  <div key={st} className="surface-card p-3 min-w-[200px] space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                      <span className="text-xs font-extrabold" style={{ color: m.color }}>{m.label}</span>
                      <span className="text-[10px] font-bold text-[var(--color-text-tertiary)]">{columnLeads.length}</span>
                    </div>
                    {columnLeads.map((l) => (
                      <div key={l.id} className="bg-[var(--color-bg-base)] rounded-xl p-3 space-y-2 text-xs border border-[var(--color-border)]">
                        <p className="font-extrabold truncate">{l.fullName}</p>
                        {l.email && <p className="text-[var(--color-text-tertiary)] truncate flex items-center gap-1"><Mail size={11} />{l.email}</p>}
                        {l.phone && <p className="text-[var(--color-text-tertiary)] truncate flex items-center gap-1"><Phone size={11} />{l.phone}</p>}
                        {l.message && <p className="text-[var(--color-text-tertiary)] line-clamp-2">{l.message}</p>}
                        {l.tags?.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {l.tags.slice(0, 3).map((t: string, i: number) => <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-bg-hover)]">{t}</span>)}
                          </div>
                        )}
                        <div className="flex items-center gap-1 pt-1">
                          {ALL_STATUSES.filter((s) => s !== st).slice(0, 2).map((ns) => (
                            <button key={ns} disabled={updating === l.id}
                              onClick={() => updateLead(l.id, { status: ns })}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded border hover:opacity-80"
                              style={{ borderColor: STATUS_META[ns]!.color, color: STATUS_META[ns]!.color }}
                            >{STATUS_META[ns]!.label}</button>
                          ))}
                          <button onClick={() => setNotesModal({ id: l.id, notes: l.notes || '' })}
                            className="ml-auto p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                            <Eye size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="surface-card overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)]">
                    <th className="text-left px-4 py-3 font-bold">Nombre</th>
                    <th className="text-left px-4 py-3 font-bold">Contacto</th>
                    <th className="text-left px-4 py-3 font-bold">Mensaje</th>
                    <th className="text-left px-4 py-3 font-bold">Estado</th>
                    <th className="text-left px-4 py-3 font-bold">Etiquetas</th>
                    <th className="text-left px-4 py-3 font-bold">Fecha</th>
                    <th className="text-right px-4 py-3 font-bold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => {
                    const sm = STATUS_META[l.status] || STATUS_META.new!
                    return (
                      <tr key={l.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-extrabold">{l.fullName}</p>
                          {l.business?.name && <p className="text-[10px] text-[var(--color-text-tertiary)]">{l.business.name}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {l.email && <p className="flex items-center gap-1"><Mail size={11} />{l.email}</p>}
                          {l.phone && <p className="flex items-center gap-1 text-[var(--color-text-secondary)]"><Phone size={11} />{l.phone}</p>}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="truncate text-[var(--color-text-tertiary)]">{l.message || '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: sm.bg, color: sm.color }}>
                            {sm.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {(l.tags || []).slice(0, 3).map((t: string, i: number) => (
                              <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-bg-hover)]">{t}</span>
                            ))}
                            <button onClick={() => setEditingTags({ id: l.id, tags: l.tags || [] })}
                              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)]"><Plus size={11} /></button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-tertiary)] text-[10px]">
                          {new Date(l.createdAt).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <select value={l.status} onChange={(e) => updateLead(l.id, { status: e.target.value })}
                              disabled={updating === l.id}
                              className="text-[10px] font-bold border rounded-lg px-1.5 py-0.5 bg-transparent"
                              style={{ borderColor: 'var(--color-border)' }}
                            >
                              {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s]!.label}</option>)}
                            </select>
                            <button onClick={() => setNotesModal({ id: l.id, notes: l.notes || '' })}
                              className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" title="Notas">
                              <Eye size={12} />
                            </button>
                            {l.status === 'won' && !l.convertedCustomerId && (
                              <button onClick={() => updateLead(l.id, { convertToCustomer: true, ...(l.fullName ? {} : {}) })}
                                disabled={updating === l.id}
                                className="p-1 text-emerald-500 hover:text-emerald-600" title="Convertir en cliente">
                                <UserCheck size={12} />
                              </button>
                            )}
                            <button onClick={() => deleteLead(l.id)} disabled={updating === l.id}
                              className="p-1 text-rose-400 hover:text-rose-500" title="Eliminar">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === page ? 'text-white shadow-sm' : 'text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'}`}
                  style={p === page ? { backgroundColor: 'var(--color-accent)' } : {}}
                >{p}</button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tags modal */}
      {editingTags && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditingTags(null)}>
          <div className="bg-[var(--color-bg-surface)] rounded-2xl p-6 w-[360px] space-y-4 shadow-2xl border border-[var(--color-border)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold">Editar Etiquetas</h3>
              <button onClick={() => setEditingTags(null)} className="p-1 text-[var(--color-text-tertiary)]"><X size={16} /></button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {editingTags.tags.map((t, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-[var(--color-bg-hover)]">
                  {t}
                  <button onClick={() => {
                    const next = editingTags.tags.filter((_, j) => j !== i)
                    setEditingTags({ ...editingTags, tags: next })
                  }}><X size={11} /></button>
                </span>
              ))}
            </div>
            <input
              placeholder="Nueva etiqueta + Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  setEditingTags({ ...editingTags, tags: [...editingTags.tags, e.currentTarget.value.trim()] })
                  e.currentTarget.value = ''
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-transparent text-xs font-semibold outline-none focus:ring-2"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={async () => {
                await updateLead(editingTags.id, { tags: editingTags.tags })
                setEditingTags(null)
              }}>Guardar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Notes modal */}
      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setNotesModal(null)}>
          <div className="bg-[var(--color-bg-surface)] rounded-2xl p-6 w-[420px] space-y-4 shadow-2xl border border-[var(--color-border)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold">Notas del lead</h3>
              <button onClick={() => setNotesModal(null)} className="p-1 text-[var(--color-text-tertiary)]"><X size={16} /></button>
            </div>
            <textarea
              value={notesModal.notes}
              onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-transparent text-xs font-semibold outline-none focus:ring-2 resize-none"
              placeholder="Escribe notas internas sobre este lead..."
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={async () => {
                await updateLead(notesModal.id, { notes: notesModal.notes })
                setNotesModal(null)
              }}>Guardar notas</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}