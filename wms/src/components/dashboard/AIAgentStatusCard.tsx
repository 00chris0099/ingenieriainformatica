'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bot, Settings2, RefreshCw, CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface AIProviderStatus {
  name: string
  configured: boolean
  maskedKey?: string
  models?: string[]
  baseUrl?: string
}

interface AIConfigStatus {
  activeProvider: string
  activeModel: string
  providers: Record<string, AIProviderStatus>
}

const PROVIDER_META: Record<string, { color: string; bg: string }> = {
  gemini: { color: '#4285F4', bg: 'rgba(66,133,244,0.12)' },
  openai: { color: '#10a37f', bg: 'rgba(16,163,127,0.12)' },
  anthropic: { color: '#d97757', bg: 'rgba(217,119,87,0.12)' },
  groq: { color: '#f55036', bg: 'rgba(245,80,54,0.12)' },
  deepseek: { color: '#4d6bfe', bg: 'rgba(77,107,254,0.12)' },
  ollama: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
}

export default function AIAgentStatusCard() {
  const [config, setConfig] = useState<AIConfigStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  async function load() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/v1/config/ai')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setConfig(data?.data || null)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const providers = config?.providers || {}
  const entries = Object.entries(providers)
  const connected = entries.filter(([, p]) => p.configured).length

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
            <Bot size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text-tertiary)' }}>
              Estado del Motor IA
              {config && (
                <Badge variant={connected > 0 ? 'success' : 'neutral'}>
                  {connected} de {entries.length} conectados
                </Badge>
              )}
            </h3>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--color-text-tertiary)' }}>
              Proveedores multi-IA · {config ? `Activo: ${providers[config.activeProvider]?.name || config.activeProvider}` : 'Cargando…'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={load}
            disabled={loading}
            title="Refrescar estado"
            className="p-2 rounded-xl border transition-all hover:bg-[var(--color-bg-hover)]"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
          <Link
            href="/configuracion?tab=ai"
            className="px-3.5 py-2 text-xs font-bold rounded-xl text-white shadow-sm transition-all hover:scale-[1.02] flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}
          >
            <Settings2 size={14} /> Configurar IA
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border animate-pulse" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-hover)' }} />
          ))}
        </div>
      ) : error || !config ? (
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
          <XCircle size={20} className="text-rose-500" />
          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            No se pudo cargar el estado de los proveedores IA
          </p>
          <button onClick={load} className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
            <RefreshCw size={12} /> Reintentar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {entries.map(([key, p]) => {
            const meta = PROVIDER_META[key] || { color: '#64748b', bg: 'rgba(100,116,139,0.12)' }
            const isActive = config.activeProvider === key
            const isConnected = !!p.configured
            return (
              <Link
                key={key}
                href="/configuracion?tab=ai"
                title={`${p.name}${p.maskedKey ? ` · clave ${p.maskedKey}` : ''}${isActive ? ' · proveedor activo' : ''}`}
                className={`p-3.5 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-md ${
                  isActive ? 'ring-2' : ''
                }`}
                style={{
                  borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                  background: 'var(--color-bg-base)',
                  ...(isActive ? ({ ['--tw-ring-color' as any]: 'var(--color-accent-muted)' } as any) : {}),
                }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: meta.bg, color: meta.color }}>
                    <Bot size={15} />
                  </div>
                  {isConnected ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : (
                    <XCircle size={14} className="text-slate-400" />
                  )}
                </div>
                <p className="text-[11px] font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
                <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                  {isActive ? (
                    <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-500 flex items-center gap-0.5">
                      <Zap size={9} /> Activo
                    </span>
                  ) : (
                    <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-full ${isConnected ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-500'}`}>
                      {isConnected ? 'Conectado' : 'Sin clave'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono mt-1 truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                  {key === 'ollama' ? (p.baseUrl || 'http://localhost:11434') : (p.maskedKey || '—')}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
