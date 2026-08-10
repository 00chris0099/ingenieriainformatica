'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard, Store, Loader2, Save, Check, Zap, CheckCircle2, XCircle, MessageSquare,
  ShieldCheck, Globe, RefreshCw, Banknote, BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'

const CURRENCIES = [
  { value: 'PEN', label: 'S/ — Sol peruano (PEN)' },
  { value: 'USD', label: '$ — Dólar (USD)' },
  { value: 'MXN', label: '$ — Peso mexicano (MXN)' },
  { value: 'COP', label: '$ — Peso colombiano (COP)' },
  { value: 'ARS', label: '$ — Peso argentino (ARS)' },
  { value: 'CLP', label: '$ — Peso chileno (CLP)' },
  { value: 'EUR', label: '€ — Euro (EUR)' },
  { value: 'GBP', label: '£ — Libra (GBP)' },
]

interface PaymentForm {
  whatsappNumber: string
  currency: string
  freeShippingThreshold: number
  defaultPaymentMethod: 'mercadopago' | 'whatsapp'
  mpEnabled: boolean
  mpToken: string // vacío = conservar el actual
  mpTokenMasked?: string
  waEnabled: boolean
  anEnabled: boolean
  gaId: string
  gaSecret: string // vacío = conservar el actual
  gaSecretMasked?: string
  plausibleDomain: string
  plausibleKey: string // vacío = conservar el actual
  plausibleKeyMasked?: string
}

const emptyForm: PaymentForm = {
  whatsappNumber: '',
  currency: 'PEN',
  freeShippingThreshold: 150,
  defaultPaymentMethod: 'whatsapp',
  mpEnabled: false,
  mpToken: '',
  waEnabled: true,
  anEnabled: true,
  gaId: '',
  gaSecret: '',
  plausibleDomain: '',
  plausibleKey: '',
}

export default function PagosPage() {
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [form, setForm] = useState<PaymentForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string; error?: string; latencyMs?: number; accountLabel?: string } | null>(null)

  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/businesses')
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data.data) ? data.data : []
        setBusinesses(list)
        // Deep link: /pagos?store=<id>
        const fromUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('store') : null
        const initial = fromUrl && list.some((b: any) => b.id === fromUrl) ? fromUrl : list[0]?.id || ''
        setSelectedId(initial)
      }
    } catch (e) {
      console.error('[PAGOS] fetch businesses:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBusinesses() }, [fetchBusinesses])

  const loadConfig = useCallback(async (id: string) => {
    if (!id) return
    setLoadingConfig(true)
    setTestResult(null)
    setSaveError('')
    try {
      const res = await fetch(`/api/v1/businesses/${id}`)
      if (res.ok) {
        const data = await res.json()
        const s: any = data.data?.settings || {}
        const mp: any = s?.payments?.mercadopago || {}
        const wa: any = s?.payments?.whatsapp || {}
        const an: any = s?.analytics || {}
        setForm({
          whatsappNumber: s?.whatsappNumber || '',
          currency: s?.currency || 'PEN',
          freeShippingThreshold: typeof s?.freeShippingThreshold === 'number' ? s.freeShippingThreshold : 150,
          defaultPaymentMethod: s?.defaultPaymentMethod === 'mercadopago' ? 'mercadopago' : 'whatsapp',
          mpEnabled: mp?.enabled !== false,
          mpToken: '',
          mpTokenMasked: mp?.accessTokenMasked || undefined,
          waEnabled: wa?.enabled !== false,
          anEnabled: an?.enabled !== false,
          gaId: an?.googleAnalyticsId || '',
          gaSecret: '',
          gaSecretMasked: an?.gaApiSecretMasked || undefined,
          plausibleDomain: an?.plausibleDomain || '',
          plausibleKey: '',
          plausibleKeyMasked: an?.plausibleApiKeyMasked || undefined,
        })
      }
    } catch (e) {
      console.error('[PAGOS] load config:', e)
    } finally {
      setLoadingConfig(false)
    }
  }, [])

  useEffect(() => { loadConfig(selectedId) }, [selectedId, loadConfig])

  const selected = businesses.find((b) => b.id === selectedId)

  const save = async () => {
    if (!selectedId) return
    setSaving(true); setSaved(false); setSaveError('')
    try {
      const res = await fetch(`/api/v1/businesses/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappNumber: form.whatsappNumber,
          currency: form.currency,
          freeShippingThreshold: form.freeShippingThreshold,
          defaultPaymentMethod: form.defaultPaymentMethod,
          payments: {
            mercadopago: {
              enabled: form.mpEnabled,
              ...(form.mpToken.trim() ? { accessToken: form.mpToken.trim() } : {}),
            },
            whatsapp: { enabled: form.waEnabled },
          },
          analytics: {
            enabled: form.anEnabled,
            googleAnalyticsId: form.gaId,
            plausibleDomain: form.plausibleDomain,
            ...(form.gaSecret.trim() ? { gaApiSecret: form.gaSecret.trim() } : {}),
            ...(form.plausibleKey.trim() ? { plausibleApiKey: form.plausibleKey.trim() } : {}),
          },
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSaved(true)
        const s: any = data.data?.settings || {}
        const mp: any = s?.payments?.mercadopago || {}
        const an: any = s?.analytics || {}
        setForm((f) => ({
          ...f,
          mpToken: '',
          mpTokenMasked: mp?.accessTokenMasked || f.mpTokenMasked,
          gaSecret: '',
          gaSecretMasked: an?.gaApiSecretMasked || f.gaSecretMasked,
          plausibleKey: '',
          plausibleKeyMasked: an?.plausibleApiKeyMasked || f.plausibleKeyMasked,
        }))
        setTimeout(() => setSaved(false), 2500)
      } else {
        setSaveError(data?.error || 'Error al guardar la configuración')
      }
    } catch (e: any) {
      setSaveError(String(e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  const runTest = async () => {
    if (!selectedId) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`/api/v1/businesses/${selectedId}/payments/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.mpToken.trim() ? { accessToken: form.mpToken.trim() } : {}),
      })
      const data = await res.json()
      setTestResult(data?.data || { ok: false, error: 'Respuesta inválida del servidor' })
    } catch (e: any) {
      setTestResult({ ok: false, error: String(e?.message || e) })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 w-64 bg-[var(--color-bg-hover)] rounded-lg animate-pulse" />
        <TableSkeleton rows={4} columns={3} />
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <EmptyState
        icon={<Store size={26} />}
        title="No hay tiendas para configurar pagos"
        description="Cuando tengas una tienda asignada, podrás conectar MercadoPago, WhatsApp, moneda y envío aquí."
      />
    )
  }

  return (
    <div className="space-y-5 pb-20 lg:pb-0 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] tracking-tight">Cobros & Pagos</h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Configura la cuenta de MercadoPago, WhatsApp, moneda y envío gratis de cada tienda — el checkout público lo usa en tiempo real
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchBusinesses} icon={<RefreshCw size={13} />}>
          Actualizar
        </Button>
      </div>

      {/* Store selector */}
      <div className="surface-card p-4">
        <label className="form-label">Tienda a configurar</label>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.slug})</option>
              ))}
            </Select>
          </div>
          {selected && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
              <Store size={13} />
              <span className="font-bold text-[var(--color-text-secondary)]">{selected.name}</span>
              <span>·</span>
              <span>{selected.pages?.length || 0} páginas</span>
            </div>
          )}
        </div>
      </div>

      {loadingConfig ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* General / shipping */}
          <Section title="Cobros & Envío" description="Moneda, método por defecto y umbral de envío gratis del checkout">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Moneda"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
              <Select
                label="Método de pago por defecto"
                value={form.defaultPaymentMethod}
                onChange={(e) => setForm({ ...form, defaultPaymentMethod: e.target.value as any })}
              >
                <option value="mercadopago">MercadoPago (tarjeta / Yape / Plin)</option>
                <option value="whatsapp">WhatsApp (pago al recibir)</option>
              </Select>
              <Input
                label="Envío gratis desde (monto)"
                type="number"
                min={0}
                value={String(form.freeShippingThreshold)}
                onChange={(e) => setForm({ ...form, freeShippingThreshold: Number(e.target.value) || 0 })}
                hint="Pedidos con este total o más no pagan envío (por defecto 150)"
              />
            </div>
            <Input
              label="Número de WhatsApp de la tienda"
              value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              placeholder="51999888777"
              hint="Recibe los pedidos por WhatsApp del checkout"
              leftIcon={<MessageSquare size={14} />}
            />
          </Section>

          {/* MercadoPago */}
          <Section title="MercadoPago" description="Cada tienda usa su propia cuenta — el token se guarda cifrado solo para el servidor">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <Toggle
                label="Activar pagos con MercadoPago"
                description="El checkout ofrecerá tarjeta, Yape, Plin y otros medios de MP"
                checked={form.mpEnabled}
                onChange={(e) => setForm({ ...form, mpEnabled: e.target.checked })}
              />
              <Badge variant={form.mpTokenMasked ? 'success' : 'neutral'}>
                {form.mpTokenMasked ? 'Cuenta conectada' : 'Sin token configurado'}
              </Badge>
            </div>

            <div>
              <label className="form-label">Access Token de MercadoPago (vendedor)</label>
              <div className="flex gap-2 items-start">
                <Input
                  type="password"
                  value={form.mpToken}
                  onChange={(e) => setForm({ ...form, mpToken: e.target.value })}
                  placeholder={form.mpTokenMasked ? `Conservando la clave actual (${form.mpTokenMasked})` : 'APP_USR-xxxx-...'}
                  className="flex-1 font-mono"
                  leftIcon={<CreditCard size={14} />}
                />
                <Button
                  variant="secondary"
                  onClick={runTest}
                  loading={testing}
                  disabled={!form.mpEnabled}
                  icon={!testing ? <Zap size={14} /> : undefined}
                  title={form.mpEnabled ? 'Probar la conexión con MercadoPago en vivo' : 'Activa MercadoPago primero'}
                >
                  {testing ? 'Probando…' : 'Probar conexión'}
                </Button>
              </div>
              <p className="form-hint mt-1.5">
                Déjalo vacío para conservar la clave actual. Consíguelo en{' '}
                <span className="font-mono">MercadoPago → Desarrollo → Credenciales</span>.
              </p>
            </div>

            {testResult && (
              <div
                className={`flex items-start gap-2.5 text-xs font-semibold rounded-xl px-3.5 py-3 ${
                  testResult.ok ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                }`}
              >
                {testResult.ok
                  ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                  : <XCircle size={15} className="shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  {testResult.ok ? (
                    <>
                      <p className="font-extrabold">Conexión exitosa · {testResult.latencyMs}ms</p>
                      <p className="mt-0.5 opacity-90">Cuenta verificada: {testResult.accountLabel || 'MercadoPago'}</p>
                      {testResult.message && <p className="mt-0.5 opacity-80">{testResult.message}</p>}
                    </>
                  ) : (
                    <p className="break-words">{testResult.error || testResult.message}</p>
                  )}
                </div>
              </div>
            )}

            {!form.mpEnabled && (
              <p className="text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                <ShieldCheck size={12} />
                MercadoPago está desactivado: el checkout usará WhatsApp automáticamente.
              </p>
            )}
          </Section>

          {/* External analytics */}
          <Section title="Analítica externa (GA4 / Plausible)" description="Conecta Google Analytics 4 o Plausible — los scripts se inyectan en tus páginas públicas y el dashboard lee las métricas de Plausible">
            <Toggle
              label="Activar analítica externa"
              description="Inyecta los scripts de medición en la página publicada"
              checked={form.anEnabled}
              onChange={(e) => setForm({ ...form, anEnabled: e.target.checked })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Google Analytics 4 — ID de medición"
                value={form.gaId}
                onChange={(e) => setForm({ ...form, gaId: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                leftIcon={<BarChart3 size={14} />}
                hint="Inyecta gtag.js y el evento page_view en tus páginas"
              />
              <Input
                label="GA4 — API Secret (Measurement Protocol)"
                type="password"
                value={form.gaSecret}
                onChange={(e) => setForm({ ...form, gaSecret: e.target.value })}
                placeholder={form.gaSecretMasked ? `Conservando el actual (${form.gaSecretMasked})` : 'GA4 → Data Streams → API secrets'}
                className="font-mono"
                hint="Permite al servidor enviar page_view, lead y purchase a GA4 (embudo completo)"
              />
              <Input
                label="Plausible — dominio del sitio"
                value={form.plausibleDomain}
                onChange={(e) => setForm({ ...form, plausibleDomain: e.target.value })}
                placeholder="mitienda.com"
                hint="Inyecta script.js de Plausible en tus páginas"
              />
            </div>
            <Input
              label="Plausible — API key (opcional, para leer stats en el dashboard)"
              type="password"
              value={form.plausibleKey}
              onChange={(e) => setForm({ ...form, plausibleKey: e.target.value })}
              placeholder={form.plausibleKeyMasked ? `Conservando la clave actual (${form.plausibleKeyMasked})` : 'Clave de la API de Plausible'}
              className="font-mono"
              hint="Déjala vacía para conservar la actual. Con ella el embudo del dashboard suma las métricas de Plausible."
            />
          </Section>

          {/* WhatsApp */}
          <Section title="WhatsApp" description="Pago al recibir / coordinación de entrega por WhatsApp">
            <Toggle
              label="Activar pedidos por WhatsApp"
              description="El checkout ofrecerá “Pedir por WhatsApp” con el resumen del pedido"
              checked={form.waEnabled}
              onChange={(e) => setForm({ ...form, waEnabled: e.target.checked })}
            />
            {!form.whatsappNumber && (
              <p className="text-[11px] text-amber-500 flex items-center gap-1.5">
                <Banknote size={12} />
                Aún no hay número configurado: agrégalo arriba para que WhatsApp funcione.
              </p>
            )}
          </Section>

          {/* Save bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            {saveError && <span className="text-xs font-bold text-rose-500">{saveError}</span>}
            {saved && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                <Check size={14} /> Configuración de pagos guardada
              </span>
            )}
            <Button onClick={save} loading={saving} icon={!saving ? <Save size={14} /> : undefined}>
              Guardar Pagos
            </Button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-1.5">
        <Globe size={12} />
        Esta configuración se aplica al instante en el checkout público de la tienda (página publicada).
      </p>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="surface-card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h3>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
