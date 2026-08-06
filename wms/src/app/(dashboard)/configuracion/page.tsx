'use client'

import { useState, useEffect } from 'react'
import { Settings, Building2, Sparkles, Palette, Globe, Save, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
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

interface AIConfig {
  defaultProvider: string
  providers: Record<string, { configured: boolean; model: string }>
}

const tabs: Array<{ id: Tab; label: string; icon: any }> = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'ai', label: 'Inteligencia Artificial', icon: Sparkles },
  { id: 'appearance', label: 'Apariencia', icon: Palette },
  { id: 'domain', label: 'Dominio', icon: Globe },
]

const industries = [
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'clinic', label: 'Clinica / Consultorio' },
  { value: 'gym', label: 'Gimnasio / Fitness' },
  { value: 'portfolio', label: 'Portafolio Personal' },
  { value: 'saas', label: 'SaaS / Software' },
  { value: 'education', label: 'Educacion / Cursos' },
  { value: 'services', label: 'Servicios Profesionales' },
]

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [business, setBusiness] = useState<BusinessData>({
    name: '', slug: '', industry: 'ecommerce', logoUrl: '', faviconUrl: '',
    primaryColor: '#2563eb', secondaryColor: '#7c3aed', accentColor: '#f59e0b',
    domain: '', subdomain: '',
  })
  const [aiConfig, setAIConfig] = useState<AIConfig>({ defaultProvider: 'openai', providers: {} })
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
        setBusiness({
          name: d.name || '', slug: d.slug || '', industry: d.industry || 'ecommerce',
          logoUrl: d.logoUrl || '', faviconUrl: d.faviconUrl || '',
          primaryColor: d.primaryColor || '#2563eb', secondaryColor: d.secondaryColor || '#7c3aed',
          accentColor: d.accentColor || '#f59e0b', domain: d.domain || '', subdomain: d.subdomain || '',
        })
      }
      if (aiRes.ok) {
        const ai = await aiRes.json()
        setAIConfig(ai.data)
      }
    } catch (e) { console.error('Error fetching config:', e) }
    finally { setLoading(false) }
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
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultProvider: aiConfig.defaultProvider }),
      })
      if (res.ok) setSaved(true)
    } catch (e) { console.error('Error saving:', e) }
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
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">Configuracion</h2>
        <p className="text-sm text-[var(--color-text-tertiary)]">Administra la configuracion de tu negocio</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab Sidebar */}
        <div className="lg:w-56 shrink-0">
          <nav className="surface-card p-2 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
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
            <AITab config={aiConfig} setConfig={setAIConfig} onSave={saveAIConfig} saving={saving} saved={saved} />
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
// General Tab
// ============================================================================
function GeneralTab({ business, setBusiness, onSave, saving, saved }: {
  business: BusinessData; setBusiness: (b: BusinessData) => void; onSave: () => void; saving: boolean; saved: boolean
}) {
  return (
    <div className="space-y-6">
      <Section title="Informacion del Negocio" description="Datos basicos de tu empresa o proyecto">
        <Input label="Nombre del negocio" value={business.name}
          onChange={e => setBusiness({ ...business, name: e.target.value })} placeholder="Mi Negocio" />
        <Input label="Slug (URL)" value={business.slug}
          onChange={e => setBusiness({ ...business, slug: e.target.value })} placeholder="mi-negocio" />
        <Select label="Industria" value={business.industry}
          onChange={e => setBusiness({ ...business, industry: e.target.value })}>
          {industries.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
        </Select>
      </Section>
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  )
}

// ============================================================================
// AI Tab
// ============================================================================
function AITab({ config, setConfig, onSave, saving, saved }: {
  config: AIConfig; setConfig: (c: AIConfig) => void; onSave: () => void; saving: boolean; saved: boolean
}) {
  return (
    <div className="space-y-6">
      <Section title="Proveedor de IA" description="Configura el servicio de inteligencia artificial para generacion de contenido">
        <Select label="Proveedor por defecto" value={config.defaultProvider}
          onChange={e => setConfig({ ...config, defaultProvider: e.target.value })}>
          <option value="openai">OpenAI (GPT)</option>
          <option value="anthropic">Anthropic (Claude)</option>
        </Select>
      </Section>

      <Section title="Estado de Proveedores" description="Verifica que proveedores estan configurados">
        <div className="space-y-3">
          {Object.entries(config.providers).map(([id, provider]) => (
            <div key={id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${provider.configured ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-tertiary)]'}`} />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)] capitalize">{id}</p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">Modelo: {provider.model}</p>
                </div>
              </div>
              <Badge variant={provider.configured ? 'success' : 'neutral'}>
                {provider.configured ? 'Configurado' : 'No configurado'}
              </Badge>
            </div>
          ))}
        </div>
        <p className="form-hint mt-3">
          Las API keys se configuran en las variables de entorno del servidor (OPENAI_API_KEY, ANTHROPIC_API_KEY).
        </p>
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
      <Section title="Colores del Tema" description="Define la paleta de colores de tu marca">
        <div className="grid grid-cols-3 gap-4">
          <ColorField label="Primario" value={business.primaryColor}
            onChange={c => setBusiness({ ...business, primaryColor: c })} />
          <ColorField label="Secundario" value={business.secondaryColor}
            onChange={c => setBusiness({ ...business, secondaryColor: c })} />
          <ColorField label="Acento" value={business.accentColor}
            onChange={c => setBusiness({ ...business, accentColor: c })} />
        </div>
        <div className="mt-4 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
          <p className="text-xs text-[var(--color-text-tertiary)] mb-3">Vista previa</p>
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: business.primaryColor }} />
            <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: business.secondaryColor }} />
            <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: business.accentColor }} />
          </div>
        </div>
      </Section>

      <Section title="Logos" description="Sube el logo y favicon de tu marca">
        <Input label="URL del Logo" value={business.logoUrl}
          onChange={e => setBusiness({ ...business, logoUrl: e.target.value })} placeholder="https://..." />
        <Input label="URL del Favicon" value={business.faviconUrl}
          onChange={e => setBusiness({ ...business, faviconUrl: e.target.value })} placeholder="https://..." />
      </Section>
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  )
}

// ============================================================================
// Domain Tab
// ============================================================================
function DomainTab({ business, setBusiness, onSave, saving, saved }: {
  business: BusinessData; setBusiness: (b: BusinessData) => void; onSave: () => void; saving: boolean; saved: boolean
}) {
  return (
    <div className="space-y-6">
      <Section title="Subdominio" description="Tu sitio estara disponible en este subdominio">
        <div className="flex items-center gap-2">
          <Input value={business.subdomain} className="flex-1"
            onChange={e => setBusiness({ ...business, subdomain: e.target.value })} placeholder="mi-negocio" />
          <span className="text-sm text-[var(--color-text-tertiary)]">.pagebuilder.com</span>
        </div>
      </Section>

      <Section title="Dominio Personalizado" description="Conecta tu propio dominio (opcional)">
        <Input label="Dominio" value={business.domain}
          onChange={e => setBusiness({ ...business, domain: e.target.value })} placeholder="www.minegocio.com" />
        <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Para usar un dominio personalizado, agrega un registro CNAME que apunte a{' '}
            <code className="text-[var(--color-accent)]">pages.pagebuilder.com</code>
          </p>
        </div>
      </Section>
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  )
}

// ============================================================================
// Shared Components
// ============================================================================
function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="section-container">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      <p className="text-xs text-[var(--color-text-tertiary)] mb-4">{description}</p>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-[var(--color-border)] cursor-pointer" />
        <Input value={value} onChange={e => onChange(e.target.value)} className="flex-1 font-mono text-xs" />
      </div>
    </div>
  )
}

function SaveBar({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
      {saved && (
        <span className="flex items-center gap-1.5 text-sm text-[var(--color-success)]">
          <Check size={14} /> Guardado
        </span>
      )}
      <Button onClick={onSave} loading={saving} icon={!saving ? <Save size={14} /> : undefined}>
        Guardar Cambios
      </Button>
    </div>
  )
}
