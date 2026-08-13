'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, BellRing, CheckCircle2, Eye, Loader2, Lock, LogOut, RefreshCw, ShieldAlert } from 'lucide-react'

interface Props {
  userEmail: string
  impersonatedByEmail?: string
  impersonatedUntil?: string
  impersonationMode?: string
  renewalsLeft?: number
}

/** Etapas de aviso antes de la expiración: informativo a los 10 min, urgente a los 2. */
const INFO_LEAD_MS = 10 * 60 * 1000
const WARN_LEAD_MS = 2 * 60 * 1000

function remainingLabel(until?: string): string {
  if (!until) return 'sesión temporal'
  const ms = new Date(until).getTime() - Date.now()
  if (ms <= 0) return 'expirada'
  const min = Math.max(1, Math.ceil(ms / 60000))
  if (min < 60) return `expira en ${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return `expira en ${h}h ${m}m`
}

function formatTime(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export default function ImpersonationBanner({
  userEmail,
  impersonatedByEmail,
  impersonatedUntil,
  impersonationMode,
  renewalsLeft,
}: Props) {
  const { update } = useSession()
  const [ending, setEnding] = useState(false)
  const [renewing, setRenewing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const infoTimerRef = useRef<number | null>(null)
  const warnTimerRef = useRef<number | null>(null)
  const firedForRef = useRef<string | null>(null)
  const actionsRef = useRef<{ renew: () => void; close: () => void }>({ renew: () => {}, close: () => {} })

  const readonly = impersonationMode === 'readonly'
  const renewAllowed = renewalsLeft === undefined || renewalsLeft > 0

  // ── Tick del countdown ──
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  // ── Estado de permiso de notificaciones ──
  useEffect(() => {
    if (typeof Notification === 'undefined') {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission)
  }, [])

  // ── Service worker (para las acciones de la notificación: renovar/cerrar) ──
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined' || Notification.permission === 'granted') return
    const p = await Notification.requestPermission().catch(() => 'denied' as NotificationPermission)
    setPermission(p)
  }, [])

  const fireExpiryNotification = useCallback(
    (until: string, stage: 'soon' | 'urgent') => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      try {
        const isUrgent = stage === 'urgent'
        const options = {
          body: isUrgent
            ? `Expira a las ${formatTime(until)}. Renueva para seguir ayudando a ${userEmail} o ciérrala.`
            : `Te quedan 10 minutos. Expira a las ${formatTime(until)} — renueva para seguir ayudando a ${userEmail} o ciérrala.`,
          tag: isUrgent ? 'imp-expiry' : 'imp-expiry-soon',
          requireInteraction: isUrgent,
          icon: '/images/brand-logo.svg',
          actions: [
            { action: 'renew', title: 'Renovar +1h' },
            { action: 'close', title: 'Cerrar sesión' },
          ],
        } as NotificationOptions & { actions: Array<{ action: string; title: string }> }
        const n = new Notification(
          isUrgent ? '⏳ Tu sesión de soporte está por expirar' : '⏰ Sesión de soporte por expirar en 10 min',
          options
        )
        // Fallback cuando el SW no está controlando la pestaña: solo enfocar.
        n.onclick = () => window.focus()
      } catch (e) {
        console.error('[imp-banner] notification failed:', e)
      }
    },
    [userEmail]
  )

  // ── Programar las alertas: a los 10 min (info) y a los 2 min (urgente) ──
  useEffect(() => {
    if (infoTimerRef.current) window.clearTimeout(infoTimerRef.current)
    if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current)
    infoTimerRef.current = null
    warnTimerRef.current = null

    const until = impersonatedUntil
    if (!until || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const untilMs = new Date(until).getTime()
    const nowMs = Date.now()
    if (untilMs <= nowMs) return

    const schedule = (leadMs: number, stage: 'soon' | 'urgent') => {
      const delay = Math.max(0, untilMs - nowMs - leadMs)
      const ref = stage === 'urgent' ? warnTimerRef : infoTimerRef
      ref.current = window.setTimeout(() => {
        if (firedForRef.current === until) return
        firedForRef.current = until
        fireExpiryNotification(until, stage)
      }, delay)
    }
    schedule(INFO_LEAD_MS, 'soon')
    schedule(WARN_LEAD_MS, 'urgent')

    return () => {
      if (infoTimerRef.current) window.clearTimeout(infoTimerRef.current)
      if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current)
      infoTimerRef.current = null
      warnTimerRef.current = null
    }
  }, [impersonatedUntil, permission, fireExpiryNotification])

  // ── Acciones ──
  const renewSession = useCallback(async () => {
    setRenewing(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/v1/auth/impersonate/renew', { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'No se pudo renovar la sesión')
      await update() // refresca impersonatedUntil + renovaciones en la sesión
      firedForRef.current = null
      setSuccess(`Sesión renovada — expira a las ${formatTime(json.expiresAt)}`)
    } catch (e: any) {
      setError(e?.message || 'Error al renovar la sesión')
    } finally {
      setRenewing(false)
    }
  }, [update])

  const endImpersonation = useCallback(async () => {
    setEnding(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/auth/impersonate/end', { method: 'POST' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error || 'No se pudo terminar la sesión')
      }
      // Hard reload so the restored admin cookie is picked up everywhere.
      window.location.href = '/'
    } catch (e: any) {
      setError(e?.message || 'Error al volver a tu cuenta')
      setEnding(false)
    }
  }, [])

  // ── SW → acciones de la notificación ──
  useEffect(() => {
    actionsRef.current = { renew: renewSession, close: endImpersonation }
  }, [renewSession, endImpersonation])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (e: MessageEvent) => {
      const data = e.data
      if (!data || data.type !== 'imp-action') return
      if (data.action === 'renew') actionsRef.current.renew()
      else if (data.action === 'close') actionsRef.current.close()
      else window.focus()
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])

  // ── El mensaje de éxito se auto-oculta ──
  useEffect(() => {
    if (!success) return
    const id = window.setTimeout(() => setSuccess(null), 6000)
    return () => window.clearTimeout(id)
  }, [success])

  void now

  const canNotify = permission === 'granted'
  const renewsLabel = renewalsLeft !== undefined ? ` · renovaciones restantes: ${renewalsLeft}` : ''

  return (
    <div
      className="relative z-[100] flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-2 text-xs font-semibold"
      style={{ background: 'linear-gradient(90deg,#7c2d12,#9a3412,#7c2d12)', color: '#ffedd5', borderBottom: '1px solid rgba(255,255,255,.15)' }}
    >
      <span className="flex items-center gap-1.5">
        <Eye size={13} />
        <ShieldAlert size={13} className="hidden sm:block" />
        <strong>Modo soporte</strong>
      </span>
      <span className="opacity-90">
        Estás viendo el portal como <strong className="underline underline-offset-2">{userEmail}</strong>
        {impersonatedByEmail && <span className="opacity-75"> (iniciada por {impersonatedByEmail})</span>}
        {' · '}{remainingLabel(impersonatedUntil)}
        {renewsLabel}
      </span>
      {readonly && (
        <span
          className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-extrabold"
          style={{ background: 'rgba(245,158,11,.2)', color: '#fde68a', border: '1px solid rgba(245,158,11,.45)' }}
          title="Solo puedes ver el portal — cualquier cambio está bloqueado"
        >
          <Lock size={10} />
          Solo lectura
        </span>
      )}

      <button
        onClick={renewSession}
        disabled={renewing || !renewAllowed}
        title={
          renewAllowed
            ? 'Extiende la sesión de soporte 1 hora más'
            : 'Alcanzaste el máximo de renovaciones para esta sesión — ciérrala e inicia una nueva'
        }
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition-colors disabled:opacity-50"
        style={{ background: 'rgba(16,185,129,.25)', color: '#d1fae5', border: '1px solid rgba(16,185,129,.45)' }}
      >
        {renewing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        Renovar +1h
      </button>

      <button
        onClick={endImpersonation}
        disabled={ending}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition-colors disabled:opacity-60"
        style={{ background: 'rgba(255,255,255,.16)', color: '#fff' }}
      >
        {ending ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
        Volver a mi cuenta
      </button>

      {permission === 'default' && (
        <button
          onClick={requestPermission}
          title="Recibir una alerta del navegador cuando la sesión esté por expirar"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition-colors hover:opacity-80"
          style={{ background: 'rgba(251,191,36,.22)', color: '#fef3c7', border: '1px solid rgba(251,191,36,.4)' }}
        >
          <Bell size={12} />
          Activar alerta de expiración
        </button>
      )}
      {canNotify && (
        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#a7f3d0' }} title="Te avisaremos a los 10 min y a los 2 min antes de que expire">
          <BellRing size={11} />
          Alertas activas · aviso a los 10 y 2 min
        </span>
      )}
      {permission === 'denied' && (
        <span className="text-[10px] font-bold opacity-70" title="Habilita las notificaciones del navegador para recibir el aviso de expiración">
          🔕 Notificaciones bloqueadas en el navegador
        </span>
      )}

      {success && (
        <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: '#a7f3d0' }}>
          <CheckCircle2 size={12} />
          {success}
        </span>
      )}
      {error && <span className="text-[11px] font-bold" style={{ color: '#fecaca' }}>{error}</span>}
    </div>
  )
}
