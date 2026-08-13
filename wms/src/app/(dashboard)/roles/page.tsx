'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  ShieldCheck, Search, Store, Users, UserCheck, ExternalLink, RefreshCw,
  Package, CalendarDays, FileText, CreditCard, Globe, Eye, Loader2, LayoutDashboard,
  ShoppingCart, TrendingUp, Newspaper, ShoppingBag, LayoutTemplate, Wand2, LogIn, ShieldAlert, LogOut, Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  store: { label: 'Tienda Virtual', color: '#0f766e', bg: '#CCFBF1' },
  landing: { label: 'Landing Page', color: '#7c3aed', bg: '#EDE9FE' },
  corporate: { label: 'Corporativa', color: '#1d4ed8', bg: '#DBEAFE' },
  page: { label: 'Página', color: '#57534e', bg: '#F5F5F4' },
}

/** Módulos del portal cliente y la condición para tenerlos. */
function clientModules(assignments: any[]): Array<{ key: string; label: string; icon: any; active: boolean; href?: string }> {
  const stores = assignments || []
  const types = new Set<string>()
  for (const a of stores) for (const p of (a.pages || [])) types.add(p.type || 'page')
  const hasStore = stores.length > 0
  return [
    { key: 'mis-tiendas', label: 'Mis Tiendas', icon: Store, active: hasStore, href: '/mis-tiendas' },
    { key: 'panel', label: 'Panel de Control', icon: LayoutDashboard, active: hasStore, href: '/' },
    { key: 'catalogo', label: 'Catálogo, precios & ofertas', icon: Package, active: types.has('store'), href: '/catalogo' },
    { key: 'pedidos', label: 'Pedidos & WhatsApp', icon: ShoppingCart, active: types.has('store'), href: '/pedidos' },
    { key: 'pagos', label: 'Pagos & Cobros', icon: CreditCard, active: hasStore, href: '/pagos' },
    { key: 'leads', label: 'Leads de mis Landings', icon: UserCheck, active: hasStore, href: '/leads' },
    { key: 'carritos', label: 'Carritos Abandonados', icon: ShoppingBag, active: hasStore, href: '/carritos-abandonados' },
    { key: 'analytics', label: 'Analytics de mi Tienda', icon: TrendingUp, active: hasStore, href: '/analytics' },
    { key: 'blog', label: 'Blog de mi Tienda', icon: Newspaper, active: types.has('corporate'), href: '/blog' },
    { key: 'citas', label: 'Citas & Agenda', icon: CalendarDays, active: hasStore, href: '/citas' },
    { key: 'diseño', label: 'Editar diseño (builder)', icon: Wand2, active: stores.some((a) => (a.pages || []).length > 0) },
  ]
}

export default function RolesPage() {
  const { data: session } = useSession()
  const impersonating = !!(session?.user as any)?.impersonating
  const [users, setUsers] = useState<any[]>([])
  const [businesses, setBusinesses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingBiz, setLoadingBiz] = useState(true)
  const [loadingAssign, setLoadingAssign] = useState(false)
  const [savingStore, setSavingStore] = useState<string | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [storeSearch, setStoreSearch] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [enteringAs, setEnteringAs] = useState<string | null>(null)
  const [activeRecord, setActiveRecord] = useState<any>(null)
  // Modal de soporte: motivo (compliance) + modo (completo / solo lectura)
  const [modalUser, setModalUser] = useState<any>(null)
  const [reasonType, setReasonType] = useState('')
  const [reasonDetail, setReasonDetail] = useState('')
  const [impMode, setImpMode] = useState<'full' | 'readonly'>('full')

  // Registro server-side de impersonación activa (cubre otro navegador/dispositivo)
  useEffect(() => {
    fetch('/api/v1/auth/impersonate/active')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setActiveRecord(j?.data?.active || null))
      .catch(() => {})
  }, [])

  const hasActiveImpersonation = impersonating || !!activeRecord

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3500)
  }

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/v1/users')
      if (res.ok) {
        const json = await res.json()
        const list = Array.isArray(json.data?.users) ? json.data.users : []
        setUsers(list)
        // Por defecto selecciona el primer cliente
        const firstClient = list.find((u: any) => u.role === 'client')
        if (firstClient && !selectedId) setSelectedId(firstClient.id)
      }
    } catch (e) {
      console.error('[ROLES users]', e)
    } finally {
      setLoadingUsers(false)
    }
  }, [selectedId])

  const fetchBusinesses = useCallback(async () => {
    setLoadingBiz(true)
    try {
      const res = await fetch('/api/v1/businesses')
      if (res.ok) {
        const json = await res.json()
        setBusinesses(Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [])
      }
    } catch (e) {
      console.error('[ROLES businesses]', e)
    } finally {
      setLoadingBiz(false)
    }
  }, [])

  const fetchAssignments = useCallback(async (userId: string) => {
    if (!userId) return
    setLoadingAssign(true)
    try {
      const res = await fetch(`/api/v1/users/${userId}/businesses`)
      if (res.ok) {
        const json = await res.json()
        setAssignments(Array.isArray(json.data) ? json.data : [])
      }
    } catch (e) {
      console.error('[ROLES assignments]', e)
    } finally {
      setLoadingAssign(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchBusinesses()
  }, [fetchUsers, fetchBusinesses])

  useEffect(() => {
    fetchAssignments(selectedId)
  }, [selectedId, fetchAssignments])

  const totalClients = useMemo(() => users.filter((u) => u.role === 'client').length, [users])

  const clients = useMemo(() => {
    const list = users.filter((u) => u.role === 'client')
    const q = clientSearch.trim().toLowerCase()
    return q
      ? list.filter((u) => (u.fullName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
      : list
  }, [users, clientSearch])

  const selected = users.find((u) => u.id === selectedId)

  const assignedIds = useMemo(() => new Set(assignments.map((a) => a.id)), [assignments])

  const filteredBusinesses = useMemo(() => {
    const q = storeSearch.trim().toLowerCase()
    return q
      ? businesses.filter((b) => (b.name || '').toLowerCase().includes(q) || (b.slug || '').includes(q))
      : businesses
  }, [businesses, storeSearch])

  const openModal = (u: any) => {
    setModalUser(u)
    setReasonType('')
    setReasonDetail('')
    setImpMode('full')
  }

  const closeModal = () => {
    if (enteringAs !== null) return
    setModalUser(null)
  }

  const confirmEnter = async () => {
    if (!modalUser) return
    const reason = [reasonType, reasonDetail.trim()].filter(Boolean).join(' — ')
    if (reason.length < 3) {
      flash('⚠️ Indica el motivo de la impersonación (ej. soporte, configuración, capacitación)')
      return
    }
    setEnteringAs(modalUser.id)
    try {
      const res = await fetch('/api/v1/auth/impersonate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: modalUser.id, reason, mode: impMode }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error || 'No se pudo iniciar la sesión')
      }
      // Full reload: the new impersonated cookie must be picked up everywhere.
      window.location.href = '/'
    } catch (e) {
      console.error('[ROLES impersonate]', e)
      flash('⚠️ ' + ((e as Error)?.message || 'Error al impersonar'))
      setEnteringAs(null)
    }
  }

  const endImpersonation = async () => {
    setEnteringAs('__end__')
    try {
      const res = await fetch('/api/v1/auth/impersonate/end', { method: 'POST' })
      if (!res.ok) throw new Error('end failed')
      // Recarga para refrescar el aviso de sesión activa en /roles
      window.location.reload()
    } catch {
      flash('⚠️ Error al terminar la sesión de soporte')
      setEnteringAs(null)
    }
  }

  const toggleStore = async (biz: any, assigned: boolean) => {
    if (!selectedId) return
    setSavingStore(biz.id)
    try {
      if (assigned) {
        const res = await fetch(`/api/v1/users/${selectedId}/businesses/${biz.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('delete failed')
        flash(`Tienda "${biz.name}" desasignada`)
      } else {
        const res = await fetch(`/api/v1/users/${selectedId}/businesses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: biz.id, role: 'owner' }),
        })
        if (!res.ok) throw new Error('assign failed')
        flash(`Tienda "${biz.name}" asignada al cliente`)
      }
      await fetchAssignments(selectedId)
    } catch (e) {
      console.error('[ROLES toggle]', e)
      flash('⚠️ Error al cambiar la asignación')
    } finally {
      setSavingStore(null)
    }
  }

  const changeRole = async (bizId: string, role: string) => {
    if (!selectedId) return
    try {
      await fetch(`/api/v1/users/${selectedId}/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: bizId, role }),
      })
      flash('Rol actualizado')
      await fetchAssignments(selectedId)
    } catch {
      flash('⚠️ Error al actualizar el rol')
    }
  }

  const modules = clientModules(assignments)
  const totalAssignments = users.reduce((sum, u) => sum + (u._count?.businesses || 0), 0)

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
            <ShieldCheck size={20} style={{ color: 'var(--color-accent)' }} />
            Roles & Accesos
          </h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Asigna tiendas virtuales a cada cliente y controla exactamente qué puede gestionar en su portal
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-full" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
            {totalClients} clientes
          </span>
          <span className="px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)]">
            {businesses.length} tiendas
          </span>
          <span className="px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)]">
            {totalAssignments} asignaciones
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Columna izquierda: clientes ── */}
        <div className="surface-card p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Clientes</h3>
            <Button variant="secondary" size="sm" onClick={() => { fetchUsers(); fetchBusinesses() }} icon={<RefreshCw size={12} />}>Actualizar</Button>
          </div>
          <Input
            placeholder="Buscar cliente..."
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            leftIcon={<Search size={13} />}
          />
          {loadingUsers ? (
            <TableSkeleton rows={5} columns={1} />
          ) : clients.length === 0 ? (
            <EmptyState icon={<Users size={22} />} title="Sin clientes" description="Crea clientes desde Usuarios y aparecerán aquí." />
          ) : (
            <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
              {clients.map((u) => (
                <div
                  key={u.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(u.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(u.id) } }}
                  className={`relative w-full text-left px-3 py-2.5 pr-10 rounded-xl border cursor-pointer transition-all ${
                    u.id === selectedId
                      ? 'border-transparent shadow-sm'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                  style={u.id === selectedId ? { background: 'var(--color-accent-muted)' } : {}}
                >
                  <p className="text-xs font-extrabold truncate" style={{ color: u.id === selectedId ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
                    {u.fullName || u.email}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">{u.email}</p>
                  <p className="text-[10px] font-bold mt-0.5 text-[var(--color-text-tertiary)]">
                    {u._count?.businesses || 0} tienda(s) asignada(s)
                  </p>
                  <button
                    title={hasActiveImpersonation ? 'Ya tienes una impersonación activa' : `Entrar como ${u.fullName || u.email}`}
                    disabled={enteringAs !== null || hasActiveImpersonation}
                    onClick={(e) => { e.stopPropagation(); openModal(u) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-40 hover:scale-105"
                    style={{ background: u.id === selectedId ? 'rgba(255,255,255,.55)' : 'var(--color-bg-hover)', color: 'var(--color-accent)' }}
                  >
                    {enteringAs === u.id ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={13} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Columna central: asignación de tiendas ── */}
        <div className="surface-card p-3 space-y-3">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Tiendas asignadas</h3>
            {selected && (
              <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">
                <strong className="font-extrabold">{selected.fullName || selected.email}</strong> · {assignments.length} de {businesses.length} tiendas
              </p>
            )}
          </div>
          <Input
            placeholder="Buscar tienda..."
            value={storeSearch}
            onChange={(e) => setStoreSearch(e.target.value)}
            leftIcon={<Search size={13} />}
          />
          {loadingBiz || loadingAssign ? (
            <TableSkeleton rows={5} columns={2} />
          ) : filteredBusinesses.length === 0 ? (
            <EmptyState icon={<Store size={22} />} title="Sin tiendas" description="Crea tiendas en el Diseñador Visual primero." />
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredBusinesses.map((b) => {
                const assigned = assignedIds.has(b.id)
                return (
                  <div
                    key={b.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      assigned ? 'border-transparent' : 'border-[var(--color-border)]'
                    }`}
                    style={assigned ? { background: 'var(--color-accent-muted)' } : { background: 'var(--color-bg-base)' }}
                  >
                    <input
                      type="checkbox"
                      checked={assigned}
                      disabled={savingStore === b.id || !selectedId}
                      onChange={() => toggleStore(b, assigned)}
                      className="w-4 h-4 accent-[var(--color-accent)] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold truncate">{b.name}</p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] truncate flex items-center gap-1">
                        <Globe size={9} /> {b.slug}
                        {Array.isArray(b.pages) && <span> · {b.pages.length} página(s)</span>}
                      </p>
                    </div>
                    {assigned && (
                      <select
                        value={(assignments.find((a) => a.id === b.id) as any)?.assignedRole || 'owner'}
                        onChange={(e) => changeRole(b.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] font-bold border rounded-lg px-1.5 py-1 bg-transparent"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <option value="owner">Propietario</option>
                        <option value="manager">Gestor</option>
                      </select>
                    )}
                    {savingStore === b.id && <Loader2 size={13} className="animate-spin text-[var(--color-text-tertiary)]" />}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Columna derecha: acceso + vista previa del portal ── */}
        <div className="space-y-4">
          {/* Soporte: impersonación */}
          <div className="surface-card p-3 space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
              <LogIn size={12} /> Soporte · Entrar como cliente
            </h3>
            {!selected ? (
              <p className="text-xs text-[var(--color-text-tertiary)]">Selecciona un cliente para ver sus acciones de soporte.</p>
            ) : hasActiveImpersonation ? (
              <div className="rounded-xl border p-2.5 space-y-2" style={{ borderColor: '#f59e0b', background: 'rgba(245,158,11,.08)' }}>
                <p className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: '#b45309' }}>
                  <ShieldAlert size={13} />
                  {impersonating
                    ? `Ya estás en modo soporte como ${(session?.user as any)?.email} — no puedes iniciar otra impersonación.`
                    : `Tienes una impersonación activa como ${activeRecord?.targetEmail || 'un cliente'} (iniciada ${activeRecord?.startedAt ? new Date(activeRecord.startedAt).toLocaleString('es-PE') : 'hace un rato'}) — probablemente desde otro navegador o dispositivo.`}
                </p>
                <button
                  onClick={endImpersonation}
                  disabled={enteringAs !== null}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all disabled:opacity-60"
                  style={{ background: '#b45309', color: '#fff' }}
                >
                  {enteringAs === '__end__' ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
                  {impersonating ? 'Volver a mi cuenta' : 'Terminar sesión de soporte'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => openModal(selected)}
                disabled={enteringAs !== null || hasActiveImpersonation}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-extrabold transition-all disabled:opacity-60 hover:opacity-90"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
              >
                {enteringAs === selected.id ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={13} />}
                Entrar como {selected.fullName || selected.email}
              </button>
            )}
            <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">
              Abre una sesión temporal de <strong>1 hora</strong> como este cliente para ver su portal tal cual lo ve él. Debes indicar un <strong>motivo</strong> (queda auditado y se notifica al equipo). Puedes entrar en <strong>solo lectura</strong> (ver sin tocar) o con acceso completo. Solo se permite <strong>una impersonación a la vez por admin</strong> (también entre navegadores/dispositivos). Cada inicio, renovación y cierre queda registrado en Auditoría & Logs.
            </p>
          </div>

          {/* Resumen de acceso */}
          <div className="surface-card p-3 space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
              <Eye size={12} /> Acceso del cliente
            </h3>
            {!selected ? (
              <p className="text-xs text-[var(--color-text-tertiary)]">Selecciona un cliente para ver su acceso.</p>
            ) : (
              <>
                <div className="space-y-1">
                  {modules.map((m) => (
                    <div key={m.key} className="flex items-center justify-between text-xs py-1 border-b border-[var(--color-border)] last:border-0">
                      <span className="flex items-center gap-1.5 font-semibold" style={{ color: m.active ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                        <m.icon size={12} style={{ color: m.active ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }} />
                        {m.label}
                      </span>
                      {m.active ? (
                        m.href ? <a href={m.href} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold" style={{ color: 'var(--color-accent)' }}>abrir ↗</a>
                          : <Badge variant="success">Sí</Badge>
                      ) : (
                        <Badge variant="neutral">No</Badge>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--color-text-tertiary)] pt-1">
                  Los módulos se activan según el tipo de página de sus tiendas: Catálogo/Pedidos si tiene tienda virtual, Blog/SEO si corporativa, Calendario/VSL si landing.
                </p>
              </>
            )}
          </div>

          {/* Vista previa del portal cliente */}
          {selected && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider" style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-tertiary)' }}>
                <span className="flex items-center gap-1.5"><LayoutDashboard size={11} /> Vista previa — portal de {selected.fullName || selected.email}</span>
              </div>
              <div className="flex" style={{ background: 'var(--color-bg-base)' }}>
                {/* Sidebar mock */}
                <div className="w-40 shrink-0 p-2 space-y-0.5 border-r" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-[9px] font-extrabold px-2 pt-1 pb-0.5 text-[var(--color-text-tertiary)]">MIS TIENDAS VIRTUALES</p>
                  {assignments.length === 0 && <p className="text-[9px] text-[var(--color-text-tertiary)] px-2 py-1">Sin tiendas asignadas</p>}
                  {assignments.map((a) => (
                    <div key={a.id} className="px-2 py-1 rounded-lg text-[10px] font-bold truncate" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                      {a.name}
                    </div>
                  ))}
                  {modules.filter((m) => m.active).map((m) => (
                    <div key={m.key} className="px-2 py-1 rounded-lg text-[10px] text-[var(--color-text-secondary)] truncate">
                      {m.label}
                    </div>
                  ))}
                </div>
                {/* Content mock */}
                <div className="flex-1 p-3 space-y-2">
                  <p className="text-[11px] font-extrabold">Mis Tiendas Virtuales</p>
                  {assignments.length === 0 && (
                    <div className="rounded-lg border border-dashed p-3 text-[10px] text-[var(--color-text-tertiary)] text-center" style={{ borderColor: 'var(--color-border)' }}>
                      «Cuando el administrador te asigne tiendas, aparecerán aquí»
                    </div>
                  )}
                  {assignments.map((a) => {
                    const types = (a.pages || []).map((p: any) => p.type)
                    return (
                      <div key={a.id} className="rounded-xl border p-2.5 space-y-1.5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-extrabold truncate">{a.name}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                            {a.assignedRole === 'manager' ? 'Gestor' : 'Propietario'}
                          </span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {(a.pages || []).map((p: any) => {
                            const meta = TYPE_META[p.type] || TYPE_META.page!
                            return (
                              <span key={p.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>
                                {meta.label}
                              </span>
                            )
                          })}
                          {a.pages?.length === 0 && <span className="text-[9px] text-[var(--color-text-tertiary)]">sin páginas</span>}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {(a.pages || []).map((p: any) => (
                            <a key={p.id} href={`/builder/${p.id}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-lg"
                              style={{ background: 'var(--color-bg-hover)', color: 'var(--color-accent)' }}>
                              <LayoutTemplate size={9} /> Editar {p.title}
                            </a>
                          ))}
                          {a.pages?.some((p: any) => p.status === 'published') && (
                            <a href={`/p/${(a.pages.find((p: any) => p.status === 'published') as any)?.slug}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-lg border"
                              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                              <ExternalLink size={9} /> Ver tienda
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de soporte: motivo + modo */}
      {modalUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div
            className="relative w-full max-w-md rounded-2xl border shadow-2xl p-5 space-y-4 animate-fade-in-up"
            style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,.15)', color: '#f59e0b' }}>
                  <LogIn size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold" style={{ color: 'var(--color-text-primary)' }}>Entrar como cliente</h3>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] truncate max-w-[240px]">
                    {modalUser.fullName || modalUser.email} · {modalUser.email}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="text-[var(--color-text-tertiary)] hover:opacity-70 text-lg leading-none" title="Cancelar">✕</button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Motivo de la sesión *</label>
              <select
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value)}
                className="w-full text-xs font-semibold border rounded-xl px-3 py-2.5 bg-transparent outline-none"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <option value="">Selecciona un motivo…</option>
                <option value="Soporte técnico">Soporte técnico</option>
                <option value="Revisión de configuración">Revisión de configuración</option>
                <option value="Capacitación al cliente">Capacitación al cliente</option>
                <option value="QA / Testing">QA / Testing</option>
                <option value="Otro">Otro</option>
              </select>
              <input
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                placeholder="Detalle (opcional, recomendado)…"
                maxLength={250}
                className="w-full text-xs font-semibold border rounded-xl px-3 py-2.5 bg-transparent outline-none"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              <p className="text-[10px] text-[var(--color-text-tertiary)]">El motivo queda registrado en Auditoría & Logs y se notifica al equipo de la agencia.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Modo de acceso</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setImpMode('full')}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 transition-all ${impMode === 'full' ? '' : 'opacity-60'}`}
                  style={impMode === 'full' ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-muted)' } : { borderColor: 'var(--color-border)' }}
                >
                  <Eye size={15} style={{ color: impMode === 'full' ? 'var(--color-accent)' : 'var(--color-text-secondary)' }} />
                  <span className="text-[11px] font-extrabold" style={{ color: 'var(--color-text-primary)' }}>Completo</span>
                  <span className="text-[9px] text-[var(--color-text-tertiary)]">Ver y gestionar</span>
                </button>
                <button
                  onClick={() => setImpMode('readonly')}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 transition-all ${impMode === 'readonly' ? '' : 'opacity-60'}`}
                  style={impMode === 'readonly' ? { borderColor: '#f59e0b', background: 'rgba(245,158,11,.1)' } : { borderColor: 'var(--color-border)' }}
                >
                  <Lock size={15} style={{ color: impMode === 'readonly' ? '#f59e0b' : 'var(--color-text-secondary)' }} />
                  <span className="text-[11px] font-extrabold" style={{ color: 'var(--color-text-primary)' }}>Solo lectura</span>
                  <span className="text-[9px] text-[var(--color-text-tertiary)]">Ver sin tocar</span>
                </button>
              </div>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">En modo solo lectura el sistema bloquea cualquier cambio (crear, editar, eliminar).</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={closeModal}
                disabled={enteringAs !== null}
                className="flex-1 px-3 py-2.5 rounded-xl text-xs font-extrabold border transition-all disabled:opacity-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmEnter}
                disabled={enteringAs !== null}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
              >
                {enteringAs === modalUser.id ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={13} />}
                Iniciar sesión temporal
              </button>
            </div>
          </div>
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
