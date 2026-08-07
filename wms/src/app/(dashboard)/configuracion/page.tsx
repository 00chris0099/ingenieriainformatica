'use client'

import { useState, useEffect } from 'react'
import { Settings, Building2, Sparkles, Palette, Globe, Save, Loader2, Check, Bot, Cpu, Key, Server, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

type Tab = 'general' | 'ai' | 'appearance' | 'domain'

interface BusinessData {
  name: string
  slug: string
  industry: string
  logoUrl: string
  faviconUrl: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  domain: string
  subdomain: string
}

interface AIProviderConfig {
  name: string
  configured: boolean
  apiKey?: string
  maskedKey?: string
  baseUrl?: string
  models: string[]
  selectedModel: string
}

interface AIConfigData {
  activeProvider: string
  activeModel: string
  systemPrompt: string
  providers: Record<string, AIProviderConfig>
}

const tabs: Array<{ id: Tab; label: string; icon: any }> = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'ai', label: 'Conector Multi-IA', icon: Sparkles },
  { id: 'appearance', label: 'Apariencia & Marca', icon: Palette },
  { id: 'domain', label: 'Dominios & SSL', icon: Globe },
]

const industries = [
  { value: 'ecommerce', label: 'E-Commerce / Tienda Virtual' },
  { value: 'moda', label: 'Moda & Tendencias' },
  { value: 'tecnologia', label: 'Tecnología & Electrónica' },
  { value: 'gastronomia', label: 'Gastronomía & Vinos' },
  { value: 'servicios', label: 'Servicios Profesionales' },
]

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [business, setBusiness] = useState<BusinessData>({
    name: '', slug: '', industry: 'ecommerce', logoUrl: '', faviconUrl: '',
    primaryColor: '#2563eb', secondaryColor: '#7c3aed', accentColor: '#f59e0b',
    domain: '', subdomain: '',
  })

  const [aiConfig, setAIConfig] = useState<AIConfigData>({
    activeProvider: 'gemini',
    activeModel: 'gemini-1.5-flash',
    systemPrompt: '',
    providers: {},
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [bizRes, aiRes] = await Promise.all([fetch('/api/v1/business'), fetch('/api/v1/config/ai')])
      if (bizRes.ok) {
        const biz = await bizRes.json()
        const d = biz.data
        if (d) {
          setBusiness({
            name: d.name || '', slug: d.slug || '', industry: d.industry || 'ecommerce',
            logoUrl: d.logoUrl || '', faviconUrl: d.faviconUrl || '',
            primaryColor: d.primaryColor || '#2563eb', secondaryColor: d.secondaryColor || '#7c3aed',
            accentColor: d.accentColor || '#f59e0b', domain: d.domain || '', subdomain: d.subdomain || '',
          })
        }
      }
      if (aiRes.ok) {
        const ai = await aiRes.json()
        if (ai.data) {
          setAIConfig(ai.data)
        }
      }
    } catch (e) {
      console.error('Error fetching config:', e)
    } finally {
      setLoading(false)
    }
  }

  async function saveBusiness() {
    setSaving(true); setSaved(false)
    try {
      const res = await fetch('/api/v1/business', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(business),
      })
      if (res.ok) setSaved(true)
    } catch (e) { console.error('Error saving:', e) }
    finally { setSaving(false); setTimeout(() => setSaved(false), 2000) }
  }

  async function saveAIConfig() {
    setSaving(true); setSaved(false)
    try {
      const res = await fetch('/api/v1/config/ai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiConfig),
      })
      if (res.ok) setSaved(true)
    } catch (e) { console.error('Error saving AI config:', e) }
    finally { setSaving(false); setTimeout(() => setSaved(false), 2000) }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48 rounded" />
        <div className="flex gap-6">
          <Skeleton className="h-64 w-56 rounded-xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            Centro de Configuración Enterprise
          </h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Administra los proveedores de IA, paleta de marca y conexión de dominios
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab Sidebar */}
        <div className="lg:w-60 shrink-0">
          <nav className="surface-card p-2 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <GeneralTab business={business} setBusiness={setBusiness} onSave={saveBusiness} saving={saving} saved={saved} />
          )}
          {activeTab === 'ai' && (
            <AIMultiProviderTab config={aiConfig} setConfig={setAIConfig} onSave={saveAIConfig} saving={saving} saved={saved} />
          )}
          {activeTab === 'appearance' && (
            <AppearanceTab business={business} setBusiness={setBusiness} onSave={saveBusiness} saving={saving} saved={saved} />
          )}
          {activeTab === 'domain' && (
            <DomainTab business={business} setBusiness={setBusiness} onSave={saveBusiness} saving={saving} saved={saved} />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// AI Multi-Provider Tab
// ============================================================================
function AIMultiProviderTab({ config, setConfig, onSave, saving, saved }: {
  config: AIConfigData; setConfig: (c: AIConfigData) => void; onSave: () => void; saving: boolean; saved: boolean
}) {
  const activeP = config.providers[config.activeProvider]

  return (
    <div className="space-y-6">
      <Section title="Motor Multi-IA de Generación" description="Conecta cualquier proveedor de Inteligencia Artificial para crear tiendas, imágenes y copys conversivos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label text-xs font-bold">Proveedor Activo Principal</label>
            <select
              value={config.activeProvider}
              onChange={(e) => {
                const prov = e.target.value
                const defaultMod = config.providers[prov]?.models[0] || ''
                setConfig({ ...config, activeProvider: prov, activeModel: defaultMod })
              }}
              className="select-field text-xs font-bold"
            >
              <option value="gemini">Google Gemini AI</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="deepseek">DeepSeek AI</option>
              <option value="groq">Groq Cloud (Fast Llama)</option>
              <option value="ollama">Ollama / Local AI Custom</option>
            </select>
          </div>

          <div>
            <label className="form-label text-xs font-bold">Modelo Seleccionado</label>
            <select
              value={config.activeModel}
              onChange={(e) => setConfig({ ...config, activeModel: e.target.value })}
              className="select-field text-xs"
            >
              {activeP?.models?.map(m => (
                <option key={m} value={m}>{m}</option>
              )) || <option value="default">Modelo por defecto</option>}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label text-xs font-bold">System Prompt Global</label>
          <textarea
            value={config.systemPrompt || ''}
            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
            placeholder="Prompt personalizado para guiar la generación de tiendas..."
            rows={3}
            className="textarea-field text-xs"
          />
        </div>
      </Section>

      <Section title="Conexión de API Keys por Proveedor" description="Ingresa tus credenciales para habilitar la generación con cada motor de IA">
        <div className="space-y-4">
          {Object.entries(config.providers || {}).map(([key, provider]) => (
            <div key={key} className="p-4 rounded-2xl border bg-[var(--color-bg-surface)] space-y-3" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={16} className={config.activeProvider === key ? 'text-purple-500' : 'text-gray-400'} />
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">{provider.name}</span>
                  {config.activeProvider === key && (
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-500">
                      Activo
                    </span>
                  )}
                </div>
                <Badge variant={provider.configured ? 'success' : 'neutral'}>
                  {provider.configured ? 'Conectado' : 'Sin Clave'}
                </Badge>
              </div>

              {key !== 'ollama' ? (
                <div>
                  <label className="form-label text-[11px]">API Key ({provider.name})</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={provider.apiKey || ''}
                      onChange={(e) => {
                        const newProv = { ...config.providers }
                        if (newProv[key]) {
                          newProv[key] = { ...newProv[key], apiKey: e.target.value }
                        }
                        setConfig({ ...config, providers: newProv })
                      }}
                      placeholder={`API Key ${provider.name}...`}
                      className="input-field text-xs flex-1 font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="form-label text-[11px]">Endpoint URL de Ollama / IA Local</label>
                  <input
                    type="text"
                    value={provider.baseUrl || 'http://localhost:11434'}
                    onChange={(e) => {
                      const newProv = { ...config.providers }
                      if (newProv[key]) {
                        newProv[key] = { ...newProv[key], baseUrl: e.target.value }
                      }
                      setConfig({ ...config, providers: newProv })
                    }}
                    className="input-field text-xs font-mono"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  )
}

// ============================================================================
// General Tab
// ============================================================================
function GeneralTab({ business, setBusiness, onSave, saving, saved }: {
  business: BusinessData; setBusiness: (b: BusinessData) => void; onSave: () => void; saving: boolean; saved: boolean
}) {
  return (
    <div className="space-y-6">
      <Section title="Información General de la Agencia / Tienda" description="Datos principales del proyecto">
        <Input label="Nombre del Negocio / Agencia" value={business.name}
          onChange={e => setBusiness({ ...business, name: e.target.value })} placeholder="Mi Empresa VPS" />
        <Input label="Slug de Identificación" value={business.slug}
          onChange={e => setBusiness({ ...business, slug: e.target.value })} placeholder="mi-empresa" />
        <Select label="Industria Principal" value={business.industry}
          onChange={e => setBusiness({ ...business, industry: e.target.value })}>
          {industries.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
        </Select>
      </Section>
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  )
}

// ============================================================================
// Appearance Tab
// ============================================================================
function AppearanceTab({ business, setBusiness, onSave, saving, saved }: {
  business: BusinessData; setBusiness: (b: BusinessData) => void; onSave: () => void; saving: boolean; saved: boolean
}) {
  return (
    <div className="space-y-6">
      <Section title="Paleta de Colores de la Marca" description="Define la identidad cromática del proyecto">
        <div className="grid grid-cols-3 gap-4">
          <ColorField label="Primario" value={business.primaryColor}
            onChange={c => setBusiness({ ...business, primaryColor: c })} />
          <ColorField label="Secundario" value={business.secondaryColor}
            onChange={c => setBusiness({ ...business, secondaryColor: c })} />
          <ColorField label="Acento" value={business.accentColor}
            onChange={c => setBusiness({ ...business, accentColor: c })} />
        </div>
      </Section>

      <Section title="Identidad Visual (Logotipos)" description="Archivos de imagen de marca">
        <Input label="URL del Logo Principal" value={business.logoUrl}
          onChange={e => setBusiness({ ...business, logoUrl: e.target.value })} placeholder="https://..." />
        <Input label="URL del Favicon (.ico)" value={business.faviconUrl}
          onChange={e => setBusiness({ ...business, faviconUrl: e.target.value })} placeholder="https://..." />
      </Section>
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  )
}

// ============================================================================
// Domain Tab (Full Enterprise Manager)
// ============================================================================
function DomainTab({ business, setBusiness, onSave, saving, saved }: {
  business: BusinessData; setBusiness: (b: BusinessData) => void; onSave: () => void; saving: boolean; saved: boolean
}) {
  const [domains, setDomains] = useState<any[]>([])
  const [loadingDomains, setLoadingDomains] = useState(true)
  const [newDomainInput, setNewDomainInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    setLoadingDomains(true)
    try {
      const res = await fetch('/api/v1/domains')
      if (res.ok) {
        const data = await res.json()
        setDomains(data.data || [])
      }
    } catch {
      /* fallback */
    } finally {
      setLoadingDomains(false)
    }
  }

  const handleAddDomain = async () => {
    if (!newDomainInput.trim()) return
    setAdding(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/v1/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomainInput }),
      })
      const data = await res.json()
      if (res.ok) {
        setNewDomainInput('')
        fetchDomains()
      } else {
        setErrorMsg(data.error?.message || 'Error al agregar dominio')
      }
    } catch {
      setErrorMsg('Error de red al registrar dominio')
    } finally {
      setAdding(false)
    }
  }

  const handleVerifyDomain = async (id: string) => {
    setVerifyingId(id)
    try {
      const res = await fetch(`/api/v1/domains/${id}`, { method: 'POST' })
      if (res.ok) {
        fetchDomains()
      }
    } catch {}
    finally {
      setVerifyingId(null)
    }
  }

  const handleDeleteDomain = async (id: string) => {
    try {
      await fetch(`/api/v1/domains/${id}`, { method: 'DELETE' })
      fetchDomains()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <Section title="Subdominio VPS Asignado" description="Dirección web gratuita asignada en la plataforma">
        <div className="flex items-center gap-2">
          <Input
            value={business.subdomain || 'mi-tienda'}
            className="flex-1"
            onChange={e => setBusiness({ ...business, subdomain: e.target.value })}
            placeholder="mi-tienda"
          />
          <span className="text-xs font-bold text-[var(--color-text-tertiary)]">.tudominio.com</span>
        </div>
      </Section>

      <Section title="Agregar Dominio Personalizado" description="Conecta tu propio dominio (.com, .pe, .net, .store)">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newDomainInput}
              onChange={e => setNewDomainInput(e.target.value)}
              placeholder="Ejemplo: adriskids.com"
              className="flex-1 font-mono text-xs"
            />
            <Button loading={adding} onClick={handleAddDomain} icon={<Globe size={14} />}>
              Conectar Dominio
            </Button>
          </div>
          {errorMsg && (
            <p className="text-xs font-semibold text-rose-500">{errorMsg}</p>
          )}
        </div>
      </Section>

      <Section title="Registros DNS para Configurar en tu Proveedor (GoDaddy, Namecheap, Cloudflare)" description="Apunta estos registros DNS para activar el enrutamiento y tu Certificado SSL gratis">
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-[var(--color-border)]">
            <span className="font-bold text-[var(--color-text-primary)]">Registro Tipo A (Dominio Raíz)</span>
            <span className="font-mono text-emerald-500 font-extrabold">187.77.57.116</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--color-text-primary)]">Registro CNAME (Subdominio www)</span>
            <span className="font-mono text-blue-500 font-bold truncate max-w-[260px]">aimachristian-tiendawms.ajcxjb.easypanel.host</span>
          </div>
        </div>
      </Section>

      <Section title="Mis Dominios Conectados" description="Estado en tiempo real del DNS y Certificado SSL Let's Encrypt">
        {loadingDomains ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-accent)]" />
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center p-6 border border-dashed rounded-xl text-xs text-[var(--color-text-tertiary)]">
            No tienes dominios personalizados conectados aún.
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((d: any) => (
              <div key={d.id} className="p-4 rounded-xl border border-[var(--color-border)] surface-card flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm font-mono text-[var(--color-text-primary)]">{d.domain}</span>
                    <Badge variant={d.sslStatus === 'active' ? 'success' : 'warning'}>
                      {d.sslStatus === 'active' ? 'SSL Activo (HTTPS)' : 'Emitiendo SSL'}
                    </Badge>
                    <Badge variant={d.status === 'verified' ? 'success' : 'neutral'}>
                      {d.status === 'verified' ? 'DNS Verificado' : 'Pendiente DNS'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
                    CNAME: {d.cnameTarget || 'aimachristian-tiendawms.ajcxjb.easypanel.host'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVerifyDomain(d.id)}
                    disabled={verifyingId === d.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border hover:bg-[var(--color-bg-hover)] transition-all"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    {verifyingId === d.id ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    Verificar DNS
                  </button>
                  <button
                    onClick={() => handleDeleteDomain(d.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    title="Eliminar dominio"
                  >
                    <Globe size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  )
}

// ============================================================================
// Shared Utilities
// ============================================================================
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div>
      <label className="form-label text-xs font-bold">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-9 h-9 rounded-xl border cursor-pointer shrink-0" style={{ borderColor: 'var(--color-border)' }} />
        <Input value={value} onChange={e => onChange(e.target.value)} className="flex-1 font-mono text-xs" />
      </div>
    </div>
  )
}

function SaveBar({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
      {saved && (
        <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--color-success)' }}>
          <Check size={14} /> Cambios guardados correctamente
        </span>
      )}
      <Button onClick={onSave} loading={saving} icon={!saving ? <Save size={14} /> : undefined}>
        Guardar Configuración
      </Button>
    </div>
  )
}
