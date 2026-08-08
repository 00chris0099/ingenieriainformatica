import { ReactNode } from 'react'

// ============================================================================
// Block System Types
// ============================================================================

export interface Block {
  id: string
  type: string
  /** Which window (ventana) this block belongs to: 'home' (default), 'catalogo', 'ofertas', or any custom id */
  windowId?: string
  settings: Record<string, any>
  content: Record<string, any>
}

export interface BlockConfig {
  id: string
  name: string
  description: string
  category: 'layout' | 'content' | 'commerce' | 'social' | 'seo'
  icon: string
  defaultSettings: Record<string, any>
  defaultContent: Record<string, any>
  settingsSchema: SettingsField[]
  aiPrompt?: string
}

export interface SettingsField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'color' | 'select' | 'toggle' | 'image' | 'link' | 'slider'
  options?: Array<{ label: string; value: string }>
  min?: number
  max?: number
  step?: number
  placeholder?: string
  group?: string
}

// ============================================================================
// Page Types
// ============================================================================

export interface SEOConfig {
  metaTitle: string
  metaDescription: string
  ogImage: string
  canonical: string
  keywords: string[]
  schema?: Record<string, any>
}

export interface ThemeConfig {
  fonts: {
    heading: string
    body: string
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    muted: string
  }
  spacing: {
    section: string
    block: string
    container: string
  }
  borderRadius: string
  shadows: {
    sm: string
    md: string
    lg: string
  }
}

export interface PageData {
  id: string
  businessId: string
  title: string
  slug: string
  description?: string
  type: 'landing' | 'page' | 'store' | 'blog' | 'checkout'
  status: 'draft' | 'published' | 'archived'
  blocks: Block[]
  seo: SEOConfig
  theme: ThemeConfig
  settings: Record<string, any>
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Business Config
// ============================================================================

export interface BusinessConfig {
  id: string
  name: string
  slug: string
  industry: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  domain?: string
  subdomain: string
  settings: Record<string, any>
}

// ============================================================================
// Render Props
// ============================================================================

export interface BlockRenderProps {
  block: Block
  theme: ThemeConfig
  business: BusinessConfig
  isPreview?: boolean
}

export interface BlockEditorProps {
  block: Block
  onChange: (settings: Record<string, any>, content: Record<string, any>) => void
  onDuplicate: () => void
  onDelete: () => void
}
