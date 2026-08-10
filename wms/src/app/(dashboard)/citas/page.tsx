'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { CalendarDays, CheckCircle2, XCircle, CheckCheck, Phone, Mail, MessageSquare, Search, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'

interface Booking {
  id: string
  date: string
  slotTime: string
  customerName: string
  customerEmail?: string | null
  customerPhone: string
  message?: string | null
  status: 'confirmed' | 'cancelled' | 'completed'
  source: string
  createdAt: string
  business?: { id: string; name: string; slug: string } | null
  page?: { id: string; title: string } | null
}

interface Business { id: string; name: string }

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
}

const STATUS_BADGE: Record<string, 'success' | 'error' | 'info' | 'neutral'> = {
  confirmed: 'success',
  cancelled: 'error',
  completed: 'info',
}

export default function CitasPage() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || ''
  const isStaff = ['super_admin', 'admin'].includes(userRole)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [bizFilter, setBizFilter] = useState('')
  const [search, setSearch] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (statusFilter) params.set('status', statusFilter)
      if (bizFilter) params.set('businessId', bizFilter)
      const [res, bizRes] = await Promise.all([
        fetch(`/api/v1/bookings?${params.toString()}`),
        fetch('/api/v1/businesses'),
      ])
      if (res.ok) {
        const d = await res.json()
        setBookings(Array.isArray(d.data) ? d.data : [])
      }
      if (bizRes.ok) {
        const d = await bizRes.json()
        const items: Business[] = Array.isArray(d.data) ? d.data : []
        setBusinesses(items)
        if (items.length === 1 && items[0]) setBizFilter(items[0].id)
      }
    } catch (e) {
      console.error('[CITAS] fetch error', e)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, bizFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = bookings.filter((b) => {
    if (search) {
      const q = search.toLowerCase()
      const hay = `${b.customerName} ${b.customerPhone || ''} ${b.customerEmail || ''} ${b.business?.name || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  async function setStatus(b: Booking, status: string) {
    setActionId(b.id)
    try {
      const res = await fetch(`/api/v1/bookings/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) fetchAll()
    } catch { /* silent */ }
    setActionId(null)
  }

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="space-y-5 pb-20 lg:pb-0 animate-fade-in">
      <PageHeader
        title="Citas & Agenda"
        description="Reservas del bloque calendario de tus páginas (agenda interna, Calendly y Google Calendar) con avisos por email y WhatsApp"
      />

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, teléfono, email o tienda…"
            className="input-field pl-9"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="md:w-48">
          <option value="">Todos los estados</option>
          <option value="confirmed">Confirmadas</option>
          <option value="cancelled">Canceladas</option>
          <option value="completed">Completadas</option>
        </Select>
        {isStaff && businesses.length > 1 && (
          <Select value={bizFilter} onChange={(e) => setBizFilter(e.target.value)} className="md:w-56">
            <option value="">Todas las tiendas</option>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        )}
      </div>

      {loading && <TableSkeleton rows={5} columns={5} />}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<CalendarDays size={28} />}
          title="No hay citas"
          description="Cuando alguien reserve en el bloque calendario de una landing page (o por Calendly), la cita aparecerá aquí con sus datos y estado."
        />
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-2.5">
          {filtered.map((b) => (
            <div key={b.id} className="surface-card p-4 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
              {/* Fecha + hora */}
              <div className="flex items-center gap-3 lg:w-44 shrink-0">
                <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ background: 'var(--color-accent-muted)' }}>
                  <span className="text-[9px] font-extrabold uppercase" style={{ color: 'var(--color-accent)' }}>
                    {new Date(b.date).toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')}
                  </span>
                  <span className="text-base font-black leading-none" style={{ color: 'var(--color-accent)' }}>
                    {new Date(b.date).getDate()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-black">{b.slotTime}</p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">{fmtDate(b.date)}</p>
                </div>
              </div>

              {/* Cliente */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{b.customerName}</h3>
                  <Badge variant={STATUS_BADGE[b.status] || 'neutral'}>{STATUS_LABEL[b.status]}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--color-text-tertiary)] flex-wrap">
                  <span className="inline-flex items-center gap-1"><Phone size={11} /> {b.customerPhone}</span>
                  {b.customerEmail && <span className="inline-flex items-center gap-1"><Mail size={11} /> {b.customerEmail}</span>}
                  {b.business && <span>· {b.business.name}</span>}
                  <span className="inline-flex items-center gap-1">
                    <ExternalLink size={11} /> {b.source === 'internal' ? 'Agenda interna' : b.source === 'calendly' ? 'Calendly' : 'Google Calendar'}
                  </span>
                </div>
                {b.message && (
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-1.5 inline-flex items-center gap-1">
                    <MessageSquare size={11} /> {b.message}
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                {b.status === 'confirmed' && (
                  <>
                    <Button size="sm" variant="ghost" loading={actionId === b.id} onClick={() => setStatus(b, 'completed')} icon={<CheckCheck size={14} />}>
                      Completar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatus(b, 'cancelled')} icon={<XCircle size={14} />} className="text-[var(--color-error)]">
                      Cancelar
                    </Button>
                  </>
                )}
                {b.status === 'cancelled' && (
                  <Button size="sm" variant="ghost" onClick={() => setStatus(b, 'confirmed')} icon={<CheckCircle2 size={14} />}>
                    Reconfirmar
                  </Button>
                )}
                {b.status === 'completed' && (
                  <Button size="sm" variant="ghost" onClick={() => setStatus(b, 'confirmed')} icon={<CheckCircle2 size={14} />}>
                    Volver a confirmada
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
