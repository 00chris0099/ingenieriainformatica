'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Eye, ShieldAlert, XCircle, RefreshCw, Globe, Clock, Loader2, ShieldCheck, ChevronRight, Ban, Lock, ClipboardList,
} from 'lucide-react'

interface SessionUser {
  id: string
  fullName: string | null
  email: string
}

interface ActiveSession {
  id: string
  admin: SessionUser
  target: SessionUser
  ipAddress: string | null
  startedAt: string
  expiresAt: string
  minutesLeft: number
  reason: string | null
  mode: string
  renewalCount: number
}

const POLL_MS = 30_000

export default function ActiveImpersonationsPanel() {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [closingAll, setClosingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auth/impersonate/sessions')
      if (!res.ok) {
        setSessions([])
        return
      }
      const json = await res.json()
      setSessions(Array.isArray(json.data) ? json.data : [])
      setError(null)
    } catch (e) {
      setError('No se pudo consultar las sesiones activas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Polling "en tiempo real": refresca cada 30s y al volver a enfocar la pestaña.
  useEffect(() => {
    const id = window.setInterval(() => {
      fetchSessions()
    }, POLL_MS)
    const onFocus = () => fetchSessions()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [fetchSessions])

  const closeSession = async (session: ActiveSession) => {
    setClosingId(session.id)
    try {
      const res = await fetch(`/api/v1/auth/impersonate/sessions/${session.id}/close`, { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'No se pudo cerrar la sesión')
      setError(null)
      await fetchSessions()
    } catch (e: any) {
      setError(e?.message || 'No se pudo cerrar la sesión')
    } finally {
      setClosingId(null)
    }
  }

  const closeAll = async () => {
    const msg =
      `¿Cerrar TODAS las ${sessions.length} impersonaciones activas de golpe?\n\n` +
      'Cada admin que esté viendo el portal de un cliente perderá el acceso al instante y quedará registrado en Auditoría & Logs.'
    if (!window.confirm(msg)) return
    setClosingAll(true)
    try {
      const res = await fetch('/api/v1/auth/impersonate/sessions/close-all', { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'No se pudo cerrar las sesiones')
      setError(null)
      await fetchSessions()
    } catch (e: any) {
      setError(e?.message || 'No se pudo cerrar las sesiones')
    } finally {
      setClosingAll(false)
    }
  }

  return (
    <div className="surface-card p-5 border" style={{ borderColor: sessions.length > 0 ? 'rgba(245,158,11,.4)' : 'var(--color-border)' }}>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,.15)', color: '#f59e0b' }}>
            <Eye size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text-tertiary)' }}>
              Impersonaciones en curso
              {sessions.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white" style={{ background: '#f59e0b' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {sessions.length} activa{sessions.length !== 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              Sesiones de soporte activas en este momento · actualización cada 30s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSessions}
            className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-bg-hover)]"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            title="Actualizar ahora"
          >
            <RefreshCw size={13} />
          </button>
          {sessions.length > 0 && (
            <button
              onClick={closeAll}
              disabled={closingAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'rgba(239,68,68,.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,.35)' }}
              title="Cerrar TODAS las impersonaciones activas (kill-switch)"
            >
              {closingAll ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
              Cerrar todas ({sessions.length})
            </button>
          )}
          <Link href="/roles" className="text-[11px] font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--color-bg-hover)', color: 'var(--color-accent)' }}>
            Roles & Accesos <ChevronRight size={11} />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs py-6 justify-center" style={{ color: 'var(--color-text-tertiary)' }}>
          <Loader2 size={14} className="animate-spin" /> Consultando sesiones…
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-4" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
            <ShieldCheck size={15} style={{ color: 'var(--color-success)' }} />
            Sin impersonaciones activas — nadie está viendo el portal de un cliente en este momento.
          </div>
          <Link href="/auditoria" className="text-[11px] font-bold flex items-center gap-1 shrink-0" style={{ color: 'var(--color-accent)' }}>
            Ver Auditoría <ChevronRight size={11} />
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-base)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,.15)', color: '#f59e0b' }}>
                <ShieldAlert size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {s.admin.fullName || s.admin.email}
                  <span className="font-semibold text-[var(--color-text-tertiary)]"> → </span>
                  {s.target.fullName || s.target.email}
                </p>
                <p className="text-[10px] mt-0.5 flex items-center gap-3 flex-wrap" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span className="flex items-center gap-1"><Globe size={9} /> IP: {s.ipAddress || '—'}</span>
                  <span className="flex items-center gap-1"><Clock size={9} /> queda ~{s.minutesLeft} min</span>
                  {s.mode === 'readonly' && (
                    <span className="flex items-center gap-1 font-extrabold" style={{ color: '#f59e0b' }}>
                      <Lock size={9} /> Solo lectura
                    </span>
                  )}
                  {s.reason && (
                    <span className="flex items-center gap-1">
                      <ClipboardList size={9} /> {s.reason}
                    </span>
                  )}
                  {s.renewalCount > 0 && (
                    <span className="flex items-center gap-1">🔄 {s.renewalCount} renovación(es)</span>
                  )}
                  <span className="font-mono">{s.admin.email}</span>
                </p>
              </div>
              <button
                onClick={() => closeSession(s)}
                disabled={closingId !== null}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all disabled:opacity-50 hover:opacity-90 shrink-0"
                style={{ background: 'rgba(239,68,68,.12)', color: '#ef4444' }}
                title="Cerrar esta sesión de soporte (revoca el acceso remoto)"
              >
                {closingId === s.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                Cerrar
              </button>
            </div>
          ))}
          {error && (
            <p className="text-[11px] font-bold mt-2" style={{ color: 'var(--color-error)' }}>{error}</p>
          )}
        </div>
      )}
      <p className="text-[10px] mt-3" style={{ color: 'var(--color-text-tertiary)' }}>
        Cerrar una sesión revoca el acceso al instante (el navegador del admin deja de ver el portal del cliente) y queda registrado en Auditoría & Logs.
      </p>
    </div>
  )
}
