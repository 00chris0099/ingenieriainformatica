'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, Search, RefreshCw, Send, Mail, Phone, User, CheckCircle2, X, Trash2, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Activo', color: '#2563eb', bg: '#dbeafe' },
  notified: { label: 'Notificado', color: '#7c3aed', bg: '#ede9fe' },
  recovered: { label: 'Recuperado', color: '#059669', bg: '#d1fae5' },
  converted: { label: 'Convertido', color: '#0d9488', bg: '#ccfbf1' },
  expired: { label: 'Expirado', color: '#6b7280', bg: '#f3f4f6' },
}

const ALL_STATUSES = ['active', 'notified', 'recovered', 'converted', 'expired']

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3500)
  }

  const fetchCarts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (businessId) params.set('businessId', businessId)
      if (search) params.set('q', search)
      const res = await fetch(`/api/v1/carts?${params}`)
      if (res.ok) {
        const json = await res.json()
        setCarts(json.data?.carts || [])
        setTotal(json.data?.total || 0)
        setCounts(json.data?.counts || {})
      }
    } catch (e) {
      console.error('[CARTS]', e)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, businessId, search])

  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/businesses')
      if (res.ok) {
        const json = await res.json()
        setBusinesses(Array.isArray(json.data) ? json.data : [])
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchCarts()
    fetchBusinesses()
  }, [fetchCarts, fetchBusinesses])

  const recoverNow = async () => {
    setSending('all')
    try {
      const res = await fetch('/api/v1/carts/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessId ? { businessId } : {}),
      })
      const json = await res.json()
      flash(
        res.ok
          ? `✅ Recordatorios enviados: ${json.data?.recovered ?? 0} carrito(s)`
          : `⚠️ ${json.error || 'Error al enviar recordatorios'}`
      )
      fetchCarts()
    } catch {
      flash('⚠️ Error de conexión')
    } finally {
      setSending(null)
    }
  }

  const notifyOne = async (id: string) => {
    setSending(id)
    try {
      const res = await fetch(`/api/v1/carts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'notify' }),
      })
      const json = await res.json()
      flash(res.ok ? '✅ Recordatorio enviado' : `⚠️ ${json.error || 'Error'}`)
      fetchCarts()
    } catch {
      flash('⚠️ Error de conexión')
    } finally {
      setSending(null)
    }
  }

  const setStatus = async (id: string, status: string) => {
    setSending(id)
    try {
      await fetch(`/api/v1/carts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', status }),
      })
      fetchCarts()
    } catch {
      flash('⚠️ Error al actualizar')
    } finally {
      setSending(null)
    }
  }

  const hasStaffBusinesses = businesses.length > 1
  const activeCount = counts.active || 0

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
            <ShoppingCart size={20} style={{ color: 'var(--color-accent)' }} />
            Carritos Abandonados
          </h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Detectamos carritos sin completar tras {Number(process.env.NEXT_PUBLIC_ABANDONED_MINUTES) || 30} min y les enviamos un enlace de recompra por email/WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => fetchCarts()} icon={<RefreshCw size={13} />}>Actualizar</Button>
          <Button size="sm" onClick={recoverNow} disabled={sending === 'all'} icon={<Send size={13} />}>
            {sending === 'all' ? 'Enviando...' : `Enviar recordatorios${activeCount ? ` (${activeCount})` : ''}`}
          </Button>
        </div>
      </div>

      {/* Stats pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => { setStatusFilter(''); }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${!statusFilter ? 'text-white shadow-sm' : 'text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'}`}
          style={!statusFilter ? { backgroundColor: 'var(--color-accent)' } : {}}
        >
          Todos ({total})
        </button>
        {ALL_STATUSES.map((st) => {
          const m = STATUS_META[st]!
          const count = counts[st] || 0
          return (
            <button key={st} onClick={() => { setStatusFilter(st === statusFilter ? '' : st) }}
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
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={14} />}
          />
        </div>
        {hasStaffBusinesses && (
          <div className="w-56">
            <Select value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
              <option value="">Todas las tiendas</option>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
        )}
      </div>

      {loading && <TableSkeleton rows={8} columns={5} />}

      {!loading && carts.length === 0 && (
        <EmptyState icon={<ShoppingCart size={26} />}
          title="No hay carritos abandonados"
          description="Cuando un visitante agregue productos a su carrito y no complete la compra, aparecerá aquí para que envíes su recordatorio de recompra automáticamente."
        />
      )}

      {!loading && carts.length > 0 && (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)]">
                <th className="text-left px-4 py-3 font-bold">Cliente</th>
                <th className="text-left px-4 py-3 font-bold">Carrito</th>
                <th className="text-left px-4 py-3 font-bold">Total</th>
                <th className="text-left px-4 py-3 font-bold">Tienda</th>
                <th className="text-left px-4 py-3 font-bold">Última actividad</th>
                <th className="text-left px-4 py-3 font-bold">Estado</th>
                <th className="text-right px-4 py-3 font-bold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {carts.map((c) => {
                const sm = STATUS_META[c.status] || STATUS_META.active!
                const names = (c.items || []).map((it: any) => `${it.name}${it.size ? ` (${it.size})` : ''} x${it.qty}`).join(', ')
                return (
                  <tr key={c.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-extrabold flex items-center gap-1"><User size={11} />{c.name || 'Anónimo'}</p>
                      {c.email && <p className="text-[var(--color-text-tertiary)] flex items-center gap-1"><Mail size={10} />{c.email}</p>}
                      {c.phone && <p className="text-[var(--color-text-tertiary)] flex items-center gap-1"><Phone size={10} />{c.phone}</p>}
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="truncate" title={names}>{names || '—'}</p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)]">{c.count} artículo(s)</p>
                    </td>
                    <td className="px-4 py-3 font-extrabold">{c.symbol} {Number(c.subtotal).toFixed(2)}</td>
                    <td className="px-4 py-3 text-[var(--color-text-tertiary)]">{c.business?.name || '—'}</td>
                    <td className="px-4 py-3 text-[10px] text-[var(--color-text-tertiary)]">
                      {new Date(c.updatedAt).toLocaleString('es-PE')}
                      {c.notifiedAt && (
                        <p className="flex items-center gap-1 text-violet-500">
                          <Clock size={10} /> notif: {new Date(c.notifiedAt).toLocaleString('es-PE')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap" style={{ backgroundColor: sm.bg, color: sm.color }}>
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(c.status === 'active' || c.status === 'notified') && (
                          <button
                            onClick={() => notifyOne(c.id)}
                            disabled={sending === c.id}
                            className="p-1.5 rounded-lg text-white text-[10px] font-bold flex items-center gap-1 hover:opacity-85"
                            style={{ backgroundColor: 'var(--color-accent)' }}
                            title="Enviar recordatorio de recompra ahora"
                          >
                            <Send size={11} /> Recordar
                          </button>
                        )}
                        {c.pageSlug && (
                          <a
                            href={`/p/${c.pageSlug}?restore=${encodeURIComponent(c.clientId || '')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" title="Ver tienda con el carrito restaurado"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                        {(c.status === 'active' || c.status === 'notified') && (
                          <button onClick={() => setStatus(c.id, 'recovered')} disabled={sending === c.id}
                            className="p-1 text-emerald-500 hover:text-emerald-600" title="Marcar recuperado">
                            <CheckCircle2 size={12} />
                          </button>
                        )}
                        <button onClick={() => setStatus(c.id, 'expired')} disabled={sending === c.id}
                          className="p-1 text-rose-400 hover:text-rose-500" title="Marcar expirado">
                          <X size={12} />
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl border"
          style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
