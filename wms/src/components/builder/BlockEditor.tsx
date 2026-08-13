'use client'

import { Block, BlockConfig, blockRegistry } from '@repo/blocks'
import { X, Copy, Trash2, Loader2, Plus, Sliders, Type, Palette, Image as ImageIcon, ArrowUp, ArrowDown, Sparkles, ChevronDown, GripVertical, Smartphone, Monitor, Maximize2, MoveVertical, PaintBucket, Square, Droplets } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ImageUploadField from '@/components/builder/ImageUploadField'
import { setDragPayload, readDragPayload } from '@/lib/block-dnd'
import { moveNestedBetweenColumns } from '@/lib/block-order'

interface BlockEditorProps {
  block: Block
  blockConfig: BlockConfig | undefined
  windows: string[]
  onChange: (settings: Record<string, any>, content: Record<string, any>) => void
  onWindowChange: (windowId: string) => void
  onDuplicate: () => void
  onDelete: () => void
  onMove?: (dir: -1 | 1) => void
  onGenerateAI?: (blockType: string) => Promise<void>
  /** Lift a nested block out of a `columns` block up to the top level. */
  onPromoteNestedBlock?: (parentId: string, nestedId: string, targetTopId?: string) => void
  /** Pull a top-level block down into a column of this `columns` block. */
  onDemoteBlock?: (blockId: string, parentId: string, colIdx: number, beforeNbId?: string) => void
  /** Canvas deep-select: field key like `logoUrl`, `buttonText` or `products:2:name`. Opens the editor scrolled to that field. */
  focusField?: string | null
}

const WINDOW_LABELS: Record<string, string> = {
  home: '🏠 Inicio',
  catalogo: '🛍️ Catálogo',
  ofertas: '🔥 Ofertas',
}

// ── BlockEditor persistence (per block) ──────────────────────────────────
const editorStateKey = (blockId: string) => `builder:block-editor:${blockId}`

interface EditorPersistedState {
  tab: 'content' | 'style'
  collapsed: string[]
  collapsedItems: string[]
}

function loadEditorState(blockId: string): EditorPersistedState | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(editorStateKey(blockId)) : null
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      tab: parsed.tab === 'style' ? 'style' : 'content',
      collapsed: Array.isArray(parsed.collapsed) ? parsed.collapsed : [],
      collapsedItems: Array.isArray(parsed.collapsedItems) ? parsed.collapsedItems : [],
    }
  } catch { return null }
}

function saveEditorState(blockId: string, state: EditorPersistedState) {
  try { if (typeof window !== 'undefined') window.localStorage.setItem(editorStateKey(blockId), JSON.stringify(state)) } catch { /* ignore */ }
}

/** Collapsible group for the list-based content sections */
function Section({ label, count, open, onToggle, action, children }: {
  label: string
  count: number
  open: boolean
  onToggle: () => void
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between">
        <button onClick={onToggle} className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-accent)] hover:opacity-80 transition-all" title={open ? 'Colapsar sección' : 'Expandir sección'}>
          <ChevronDown size={13} className={`transition-transform duration-150 ${open ? '' : '-rotate-90'}`} />
          {label} ({count})
        </button>
        {action}
      </div>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  )
}

function field(label: string, input: React.ReactNode, hint?: string) {
  return (
    <div>
      <label className="form-label text-[11px] font-bold">{label}</label>
      {input}
      {hint && <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">{hint}</p>}
    </div>
  )
}

/** Presets de degradados de un clic para el fondo de sección. */
const GRADIENT_PRESETS = [
  { name: 'Amanecer', from: '#f97316', to: '#f43f5e', dir: 'to bottom right' },
  { name: 'Océano', from: '#06b6d4', to: '#2563eb', dir: 'to right' },
  { name: 'Neón', from: '#a855f7', to: '#ec4899', dir: 'to right' },
  { name: 'Crepúsculo', from: '#6366f1', to: '#a855f7', dir: 'to bottom' },
  { name: 'Esmeralda', from: '#34d399', to: '#059669', dir: 'to right' },
  { name: 'Atardecer', from: '#f59e0b', to: '#ef4444', dir: 'to bottom' },
  { name: 'Medianoche', from: '#334155', to: '#0f172a', dir: 'to bottom' },
  { name: 'Aurora', from: '#22d3ee', to: '#8b5cf6', dir: '135deg' },
] as const

/** Slider compacto para el panel de espaciado fino (padding del wrapper del bloque). */
function SpacingSlider({ label, value, max, onChange }: { label: string; value: number | undefined; max: number; onChange: (v: number) => void }) {
  const v = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return (
    <div className="flex-1 min-w-[80px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>{v}px</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={4}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-accent)]"
      />
    </div>
  )
}

function textInput(value: string, onChange: (v: string) => void, placeholder?: string, mono = false) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`input-field text-xs ${mono ? 'font-mono' : 'font-semibold'}`}
    />
  )
}

// Editor de destino de enlace: ventana de la tienda / ancla de la misma página / URL externa / WhatsApp
export interface LinkDest { type: 'window' | 'anchor' | 'external' | 'whatsapp'; value: string }

export function normalizeLink(value: any): LinkDest {
  if (!value) return { type: 'external', value: '' }
  if (typeof value === 'string') return { type: 'external', value }
  return { type: value.type || 'external', value: value.value || '' }
}

export function LinkField({ label, value, onChange, windows, hint }: {
  label: string
  value: any
  onChange: (v: LinkDest) => void
  windows: string[]
  hint?: string
}) {
  const v = normalizeLink(value)
  const placeholder =
    v.type === 'anchor' ? '#productos' :
    v.type === 'whatsapp' ? '51999999999' :
    v.type === 'external' ? 'https://…' :
    ''
  return (
    <div>
      <label className="form-label text-[11px] font-bold">{label}</label>
      <div className="space-y-1.5">
        <select
          value={v.type}
          onChange={(e) => onChange({ type: e.target.value as LinkDest['type'], value: v.value })}
          className="select-field text-[10px] w-full"
        >
          <option value="window">Ventana de la tienda</option>
          <option value="anchor">Misma página (ancla)</option>
          <option value="external">Enlace externo</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        {v.type === 'window' ? (
          <select value={v.value || ''} onChange={(e) => onChange({ type: v.type, value: e.target.value })} className="select-field text-[10px] w-full">
            <option value="">Selecciona la ventana…</option>
            {(windows || []).map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={v.value || ''}
            onChange={(e) => onChange({ type: v.type, value: e.target.value })}
            placeholder={placeholder}
            className="input-field text-xs font-mono"
          />
        )}
      </div>
      {hint && <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">{hint}</p>}
    </div>
  )
}

export default function BlockEditor({ block, blockConfig, windows, onChange, onWindowChange, onDuplicate, onDelete, onMove, onGenerateAI, onPromoteNestedBlock, onDemoteBlock, focusField }: BlockEditorProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'style'>(() => loadEditorState(block.id)?.tab || 'content')
  const [collapsed, setCollapsed] = useState<string[]>(() => loadEditorState(block.id)?.collapsed || [])
  const [collapsedItems, setCollapsedItems] = useState<string[]>(() => loadEditorState(block.id)?.collapsedItems || [])
  const [generating, setGenerating] = useState(false)
  // Drag & drop state for nested blocks (columns manager)
  const [nestedDrag, setNestedDrag] = useState<{ id: string; colIdx: number; nbIdx: number } | null>(null)
  const [columnDropTarget, setColumnDropTarget] = useState<{ colIdx: number; nbIdx?: number } | null>(null)

  // Restore this block's editor state when switching blocks, and persist on change
  useEffect(() => {
    const s = loadEditorState(block.id)
    setActiveTab(s?.tab || 'content')
    setCollapsed(s?.collapsed || [])
    setCollapsedItems(s?.collapsedItems || [])
  }, [block.id])

  useEffect(() => {
    saveEditorState(block.id, { tab: activeTab, collapsed, collapsedItems })
  }, [block.id, activeTab, collapsed, collapsedItems])

  const isSectionOpen = (key: string) => !collapsed.includes(key)
  const toggleSection = (key: string) => {
    setCollapsed(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  const isItemOpen = (listKey: string, index: number) => !collapsedItems.includes(`${listKey}:${index}`)
  const toggleItem = (listKey: string, index: number) => {
    const itemKey = `${listKey}:${index}`
    setCollapsedItems(prev => (prev.includes(itemKey) ? prev.filter(k => k !== itemKey) : [...prev, itemKey]))
  }
  /** Indices shift when a list is reordered/removed — reset that list's collapse state to stay honest */
  const clearCollapsedForList = (listKey: string) => {
    setCollapsedItems(prev => prev.filter(k => !k.startsWith(`${listKey}:`)))
  }

  // ── Keep the inspector scrolled to the same place when switching blocks ──
  // The container clamps scrollTop to 0 when a short block is shown, so remember
  // each block's position and restore it when the block is selected again.
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollCache = useRef<Record<string, number>>({})
  const handleEditorScroll = () => {
    if (scrollRef.current) scrollCache.current[block.id] = scrollRef.current.scrollTop
  }

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      const cached = scrollCache.current[block.id]
      el.scrollTop = typeof cached === 'number' ? cached : 0
    }
  }, [block.id])

  // ── Canvas deep-select: focus a specific field (logo, button, image, item…) ──
  // The canvas tags inner elements with `data-edit-field` (e.g. `logoUrl`, `buttonText`,
  // `products:2:name`). Here we map that key to the inspector's field label, expand the
  // section/item it lives in and scroll + pulse + focus it — like Shopify's inspector.
  const FIELD_LABELS: Record<string, { labels: string[]; tab?: 'content' | 'style' }> = {
    logoUrl: { labels: ['Logo de la marca'] },
    brandName: { labels: ['Nombre de la Marca'] },
    announcement: { labels: ['Anuncio superior'] },
    badge: { labels: ['Etiqueta / Badge', 'Etiqueta superior', 'Etiqueta'] },
    title: { labels: ['Título Principal', 'Título del Catálogo', 'Título de la sección', 'Título'] },
    headline: { labels: ['Titular'] },
    subtitle: { labels: ['Subtítulo / Bajada', 'Subtítulo'] },
    text: { labels: ['Contenido'] },
    description: { labels: ['Descripción'] },
    buttonText: { labels: ['Botón Principal', 'Texto Botón Principal', 'Texto del botón', 'Texto botón'] },
    secondaryButtonText: { labels: ['Botón Secundario', 'Texto Botón Secundario'] },
    heroImage: { labels: ['Imagen de fondo / Hero'] },
    src: { labels: ['Imagen'] },
    caption: { labels: ['Pie de foto'] },
    imageUrl: { labels: ['Imagen del producto'] },
    thumbnailUrl: { labels: ['Imagen de portada'] },
    ctaText: { labels: ['Texto del botón'] },
    address: { labels: ['Dirección'] },
    phone: { labels: ['Teléfono / WhatsApp'] },
    email: { labels: ['Correo'] },
    companyName: { labels: ['Nombre de la marca'] },
    tagline: { labels: ['Frase (tagline)'] },
    name: { labels: ['Nombre'] },
    price: { labels: ['Precio'] },
    role: { labels: ['Rol', 'Cargo'] },
    question: { labels: ['Pregunta'] },
    videoUrl: { labels: ['URL del video'] },
    hours: { labels: ['Horarios disponibles'] },
  }

  interface ParsedFocus { base: string; listKey?: string; itemIndex?: number }
  const parseFocusKey = (field: string): ParsedFocus => {
    const parts = String(field || '').split(':')
    if (parts.length === 3) {
      const idx = parseInt(parts[1]!, 10)
      if (!isNaN(idx)) return { base: parts[2]!, listKey: parts[0]!, itemIndex: idx }
    }
    if (parts.length === 2) {
      const idx = parseInt(parts[1]!, 10)
      if (!isNaN(idx)) return { base: parts[0]!, listKey: parts[0]!, itemIndex: idx }
    }
    return { base: parts[0] || field || '' }
  }

  /** Header text of the item cards ("Producto 1", "Beneficio 2", "Plan 3"…). */
  const CARD_HEADER_RE = /(producto|beneficio|testimonio|miembro|plan|art[ií]culo|pregunta|enlace)\s*(\d+)/i

  /** Locates the DOM node (field wrapper, input or section header) matching the focused field. */
  const locateFocusField = (root: HTMLElement, parsed: ParsedFocus): HTMLElement | null => {
    const listKey = parsed.listKey
    const itemIndex = parsed.itemIndex
    const meta = FIELD_LABELS[parsed.base]
    // Raw list fields without per-item labels: gallery images, social-proof messages
    if (!meta) {
      if (listKey && (listKey === 'images' || listKey === 'messages')) {
        const sectionLabel = listKey === 'images' ? 'Imágenes' : 'Mensajes'
        const header = Array.from(root.querySelectorAll('button')).find((b) =>
          (b.textContent || '').trim().startsWith(sectionLabel)
        )
        if (!header) return null
        // Sección: botón → fila del encabezado → contenedor (space-y-2 pt-1) con los inputs
        const section = header.parentElement?.parentElement
        if (section && itemIndex !== undefined) {
          const inputs = Array.from(section.querySelectorAll('input'))
          const target = inputs[itemIndex]
          if (target) return target
        }
        return section || header
      }
      return null
    }
    const labels = meta.labels
    for (const lab of Array.from(root.querySelectorAll('label.form-label'))) {
      const text = (lab.textContent || '').trim()
      if (!labels.some((l) => text === l || text.startsWith(l))) continue
      const wrapper = lab.parentElement
      if (!wrapper) continue
      // For item fields, make sure this label belongs to the requested card index
      if (listKey && itemIndex !== undefined) {
        let node: HTMLElement | null = wrapper
        let inCard = false
        while (node && node !== root) {
          const head = node.textContent || ''
          const m = head.match(CARD_HEADER_RE)
          if (m) {
            inCard = true
            if (parseInt(m[2]!, 10) - 1 === itemIndex) return wrapper
            break
          }
          node = node.parentElement
        }
        if (inCard) continue // this label belongs to a different card
        continue // section-level label — not the item target
      }
      return wrapper
    }
    return null
  }

  // Expand the required section/item first, then scroll + highlight + focus the field.
  // When the state settles (section opened), the effect re-runs and performs the locate.
  useLayoutEffect(() => {
    if (!focusField) return
    const parsed = parseFocusKey(focusField)
    const meta = FIELD_LABELS[parsed.base]
    let changed = false
    const listKey = parsed.listKey
    if (meta?.tab && activeTab !== meta.tab) { setActiveTab(meta.tab); changed = true }
    if (listKey) {
      if (collapsed.includes(listKey)) { setCollapsed((prev) => prev.filter((k) => k !== listKey)); changed = true }
      if (parsed.itemIndex !== undefined) {
        const itemKey = `${listKey}:${parsed.itemIndex}`
        if (collapsedItems.includes(itemKey)) { setCollapsedItems((prev) => prev.filter((k) => k !== itemKey)); changed = true }
      }
    }
    if (changed) return
    const root = scrollRef.current
    if (!root) return
    const target = locateFocusField(root, parsed)
    if (!target) return
    const top = target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 14
    try { root.scrollTo({ top: Math.max(0, top), behavior: 'smooth' }) } catch { /* jsdom */ }
    target.classList.add('editor-field-focus')
    window.setTimeout(() => target.classList.remove('editor-field-focus'), 2600)
    const tag = target.tagName
    const focusable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      ? (target as HTMLElement)
      : target.querySelector('input, textarea, select') as HTMLElement | null
    if (focusable) { try { focusable.focus({ preventScroll: true }) } catch { /* jsdom */ } }
  }, [focusField, activeTab, collapsed, collapsedItems, block.id])

  if (!blockConfig) {
    return (
      <div className="w-80 border-l border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 flex flex-col items-center justify-center text-center">
        <Sliders className="w-8 h-8 opacity-30 mb-2 text-[var(--color-text-tertiary)]" />
        <p className="text-xs font-semibold text-[var(--color-text-primary)]">Selecciona un bloque</p>
        <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">Haz clic en cualquier sección del canvas para editar sus propiedades</p>
      </div>
    )
  }

  const settings = block.settings || {}
  const content = block.content || {}
  const type = block.type

  const handleSettingChange = (key: string, value: any) => {
    onChange({ ...settings, [key]: value }, content)
  }

  const handleContentChange = (key: string, value: any) => {
    onChange(settings, { ...content, [key]: value })
  }

  const updateItemInList = (listKey: string, index: number, itemField: string, itemValue: any) => {
    const list = Array.isArray(content[listKey]) ? [...content[listKey]] : []
    if (list[index]) {
      const item = typeof list[index] === 'object' ? list[index] : {}
      list[index] = { ...item, [itemField]: itemValue }
      handleContentChange(listKey, list)
    }
  }

  const updateRawItemInList = (listKey: string, index: number, itemValue: any) => {
    const list = Array.isArray(content[listKey]) ? [...content[listKey]] : []
    list[index] = itemValue
    handleContentChange(listKey, list)
  }

  const addItemToList = (listKey: string, defaultItem: any) => {
    const list = Array.isArray(content[listKey]) ? [...content[listKey]] : []
    list.push(defaultItem)
    handleContentChange(listKey, list)
  }

  const removeItemFromList = (listKey: string, index: number) => {
    clearCollapsedForList(listKey)
    const list = Array.isArray(content[listKey]) ? [...content[listKey]] : []
    list.splice(index, 1)
    handleContentChange(listKey, list)
  }

  const moveItemInList = (listKey: string, index: number, dir: -1 | 1) => {
    const list = Array.isArray(content[listKey]) ? [...content[listKey]] : []
    const target = index + dir
    if (target < 0 || target >= list.length) return
    const [item] = list.splice(index, 1)
    list.splice(target, 0, item)
    clearCollapsedForList(listKey)
    handleContentChange(listKey, list)
  }

  const itemCard = (children: React.ReactNode, listKey: string, index: number, title: string) => {
    const open = isItemOpen(listKey, index)
    return (
      <div key={index} className={`p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] relative ${open ? 'space-y-2' : ''}`}>
        <div className="flex items-center justify-between sticky top-0 z-10 bg-[var(--color-bg-base)]">
          <button onClick={() => toggleItem(listKey, index)} className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors" title={open ? 'Colapsar' : 'Expandir'}>
            <ChevronDown size={12} className={`transition-transform duration-150 ${open ? '' : '-rotate-90'}`} />
            {title} {index + 1}
          </button>
          <div className="flex items-center gap-0.5">
            <button onClick={() => moveItemInList(listKey, index, -1)} className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" title="Subir"><ArrowUp size={12} /></button>
            <button onClick={() => moveItemInList(listKey, index, 1)} className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" title="Bajar"><ArrowDown size={12} /></button>
            <button onClick={() => removeItemFromList(listKey, index)} className="p-0.5 text-[var(--color-error)] hover:opacity-80" title="Quitar"><Trash2 size={12} /></button>
          </div>
        </div>
        {open && <div className="mt-2 space-y-2">{children}</div>}
      </div>
    )
  }

  // ── Per-block-type content editors ─────────────────────────────────────
  const renderContentEditors = () => {
    // NAVBAR
    if (type === 'navbar') {
      const links = Array.isArray(content.links) ? content.links : []
      return (
        <div className="space-y-4">
          {field('Nombre de la Marca (texto)', textInput(content.brandName || '', (v) => handleContentChange('brandName', v), 'ADRISU KIDS'))}
          <ImageUploadField
            label="Logo de la marca"
            value={content.logoUrl || ''}
            onChange={(v) => handleContentChange('logoUrl', v)}
            previewClass="h-12 w-auto"
            placeholder="https://.../logo.png"
          />
          {field('Anuncio superior (barra)', textInput(content.announcement || '', (v) => handleContentChange('announcement', v), '✨ ENVÍO GRATIS EN COMPRAS MAYORES A S/120'))}

          <Section
            label="Enlaces del Menú"
            count={links.length}
            open={isSectionOpen('links')}
            onToggle={() => toggleSection('links')}
            action={
              <button
                onClick={() => addItemToList('links', { label: 'Nueva Ventana', windowId: 'home', iconName: 'Home' })}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all"
              >
                <Plus size={11} /> Añadir
              </button>
            }
          >
            <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">
              Cada enlace navega a una <b>ventana</b>: <code>home</code> (Inicio), <code>catalogo</code> (Catálogo), el id de una ventana propia, o <code>whatsapp</code>.
            </p>
            {links.map((link: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] space-y-2 relative">
                <div className="flex items-center justify-between sticky top-0 z-10 bg-[var(--color-bg-base)]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Enlace {idx + 1}</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => moveItemInList('links', idx, -1)} className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" title="Subir"><ArrowUp size={12} /></button>
                    <button onClick={() => moveItemInList('links', idx, 1)} className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" title="Bajar"><ArrowDown size={12} /></button>
                    <button onClick={() => removeItemFromList('links', idx)} className="p-0.5 text-[var(--color-error)] hover:opacity-80" title="Quitar"><Trash2 size={12} /></button>
                  </div>
                </div>
                {field('Etiqueta', textInput(link.label || '', (v) => updateItemInList('links', idx, 'label', v), 'Colección Niños'))}
                <div className="grid grid-cols-2 gap-2">
                  {field('Ventana (windowId)', textInput(link.windowId || '', (v) => updateItemInList('links', idx, 'windowId', v), 'catalogo', true))}
                  {field('Categoría (opcional)', textInput(link.categoryId || '', (v) => updateItemInList('links', idx, 'categoryId', v), 'ninos', true))}
                </div>
              </div>
            ))}
          </Section>
        </div>
      )
    }

    // HERO
    if (type === 'hero') {
      return (
        <div className="space-y-4">
          {field('Etiqueta / Badge', textInput(content.badge || '', (v) => handleContentChange('badge', v), 'NUEVA COLECCIÓN 2026'))}
          {field('Título Principal', textInput(content.title || '', (v) => handleContentChange('title', v), 'Moda & Tendencias'))}
          {field('Subtítulo', (
            <textarea value={content.subtitle || ''} onChange={(e) => handleContentChange('subtitle', e.target.value)} rows={2} className="textarea-field text-xs" placeholder="Descripción secundaria..." />
          ))}
          <div className="grid grid-cols-2 gap-2">
            {field('Botón Principal', textInput(content.buttonText || '', (v) => handleContentChange('buttonText', v), 'Ver Catálogo'))}
            {field('Botón Secundario', textInput(content.secondaryButtonText || '', (v) => handleContentChange('secondaryButtonText', v), 'Explorar Ofertas'))}
          </div>
          <LinkField
            label="Destino del botón principal"
            value={content.primaryLink}
            onChange={(v) => handleContentChange('primaryLink', v)}
            windows={windows}
            hint="Ventana de la tienda, ancla de la misma página, URL externa o WhatsApp"
          />
          <LinkField
            label="Destino del botón secundario"
            value={content.secondaryLink}
            onChange={(v) => handleContentChange('secondaryLink', v)}
            windows={windows}
          />
          <ImageUploadField
            label="Imagen de fondo / Hero"
            value={content.heroImage || ''}
            onChange={(v) => handleContentChange('heroImage', v)}
            previewClass="h-24 w-full"
            placeholder="https://.../hero.jpg"
          />
        </div>
      )
    }

    // PRODUCT GRID (full catalog editor)
    if (type === 'product-grid') {
      const products = Array.isArray(content.products) ? content.products : []
      const tabs = Array.isArray(content.categoryTabs) ? content.categoryTabs : []
      return (
        <div className="space-y-5">
          {field('Título del Catálogo', textInput(content.title || '', (v) => handleContentChange('title', v), 'Catálogo de Productos'))}
          {field('Subtítulo', (
            <textarea value={content.subtitle || ''} onChange={(e) => handleContentChange('subtitle', e.target.value)} rows={2} className="textarea-field text-xs" placeholder="Descripción..." />
          ))}

          {/* Category tabs */}
          <Section
            label="Pestañas de Categoría"
            count={tabs.length}
            open={isSectionOpen('categoryTabs')}
            onToggle={() => toggleSection('categoryTabs')}
            action={
              <button
                onClick={() => addItemToList('categoryTabs', { id: `cat-${Date.now()}`, label: 'Nueva Categoría' })}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all"
              >
                <Plus size={11} /> Añadir
              </button>
            }
          >
            {tabs.map((tab: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={tab.id || ''}
                  onChange={(e) => updateItemInList('categoryTabs', idx, 'id', e.target.value)}
                  className="input-field text-xs font-mono w-24"
                  placeholder="id"
                />
                <input
                  type="text"
                  value={tab.label || ''}
                  onChange={(e) => updateItemInList('categoryTabs', idx, 'label', e.target.value)}
                  className="input-field text-xs flex-1"
                  placeholder="Etiqueta"
                />
                <button onClick={() => removeItemFromList('categoryTabs', idx)} className="p-1 text-[var(--color-error)] hover:opacity-80"><Trash2 size={12} /></button>
              </div>
            ))}
          </Section>

          {/* Products */}
          <Section
            label="Productos"
            count={products.length}
            open={isSectionOpen('products')}
            onToggle={() => toggleSection('products')}
            action={
              <button
                onClick={() => addItemToList('products', { id: `p-${Date.now()}`, category: 'general', name: 'Nuevo Producto', price: 'S/ 50.00', sizes: [], description: '' })}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all"
              >
                <Plus size={11} /> Añadir
              </button>
            }
          >
            {products.map((item: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] space-y-2">
                <div className="flex items-center justify-between sticky top-0 z-10 bg-[var(--color-bg-base)]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Producto {idx + 1}</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => moveItemInList('products', idx, -1)} className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"><ArrowUp size={12} /></button>
                    <button onClick={() => moveItemInList('products', idx, 1)} className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"><ArrowDown size={12} /></button>
                    <button onClick={() => removeItemFromList('products', idx)} className="p-0.5 text-[var(--color-error)] hover:opacity-80"><Trash2 size={12} /></button>
                  </div>
                </div>
                {field('Nombre', textInput(item.name || '', (v) => updateItemInList('products', idx, 'name', v), 'Nombre del producto'))}
                <div className="grid grid-cols-2 gap-2">
                  {field('Precio', textInput(item.price || '', (v) => updateItemInList('products', idx, 'price', v), 'S/ 59.90', true))}
                  {field('Precio original', textInput(item.originalPrice || '', (v) => updateItemInList('products', idx, 'originalPrice', v), 'S/ 89.90', true))}
                  {field('Categoría', textInput(item.category || '', (v) => updateItemInList('products', idx, 'category', v), 'ninos', true))}
                  {field('Badge descuento', textInput(item.discountBadge || '', (v) => updateItemInList('products', idx, 'discountBadge', v), '-33% OFF'))}
                </div>
                <ImageUploadField
                  label="Imagen del producto"
                  value={item.imageUrl || ''}
                  onChange={(v) => updateItemInList('products', idx, 'imageUrl', v)}
                  previewClass="h-16 w-16"
                  placeholder="https://.../foto.jpg"
                />
                {field('Tallas (separadas por coma)', textInput(Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes || '', (v) => updateItemInList('products', idx, 'sizes', v.split(',').map((s: string) => s.trim()).filter(Boolean)), '2T, 4T, 6T, 8T', true))}
                {field('Descripción', (
                  <textarea value={item.description || ''} onChange={(e) => updateItemInList('products', idx, 'description', e.target.value)} rows={2} className="textarea-field text-xs" placeholder="Descripción del producto..." />
                ))}
              </div>
            ))}
          </Section>
        </div>
      )
    }

    // FAQ / accordion
    if (type === 'faq' || type === 'accordion') {
      const items = Array.isArray(content.items) ? content.items : []
      return (
        <div className="space-y-4">
          {field('Título', textInput(content.title || '', (v) => handleContentChange('title', v), 'Preguntas Frecuentes'))}
          <Section
            label="Preguntas"
            count={items.length}
            open={isSectionOpen('items')}
            onToggle={() => toggleSection('items')}
            action={
              <button onClick={() => addItemToList('items', { question: '¿Nueva pregunta?', answer: 'Respuesta...' })} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all"><Plus size={11} /> Añadir</button>
            }
          >
            {items.map((item: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Pregunta {idx + 1}</span>
                  <button onClick={() => removeItemFromList('items', idx)} className="p-0.5 text-[var(--color-error)] hover:opacity-80"><Trash2 size={12} /></button>
                </div>
                {field('Pregunta', textInput(item.question || item.title || '', (v) => updateItemInList('items', idx, 'question', v)))}
                {field('Respuesta', (
                  <textarea value={item.answer || item.content || ''} onChange={(e) => updateItemInList('items', idx, 'answer', e.target.value)} rows={2} className="textarea-field text-xs" />
                ))}
              </div>
            ))}
          </Section>
        </div>
      )
    }

    // TESTIMONIALS
    if (type === 'testimonials') {
      const items = Array.isArray(content.items) ? content.items : []
      return (
        <div className="space-y-4">
          {field('Título', textInput(content.title || '', (v) => handleContentChange('title', v), 'Opiniones de Clientes'))}
          <Section
            label="Testimonios"
            count={items.length}
            open={isSectionOpen('items')}
            onToggle={() => toggleSection('items')}
            action={
              <button onClick={() => addItemToList('items', { text: '¡Excelente servicio!', name: 'Cliente', role: 'Comprador verificado' })} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all"><Plus size={11} /> Añadir</button>
            }
          >
            {items.map((item: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Testimonio {idx + 1}</span>
                  <button onClick={() => removeItemFromList('items', idx)} className="p-0.5 text-[var(--color-error)] hover:opacity-80"><Trash2 size={12} /></button>
                </div>
                {field('Texto', (
                  <textarea value={item.text || item.comment || ''} onChange={(e) => updateItemInList('items', idx, 'text', e.target.value)} rows={2} className="textarea-field text-xs" />
                ))}
                <div className="grid grid-cols-2 gap-2">
                  {field('Nombre', textInput(item.name || '', (v) => updateItemInList('items', idx, 'name', v), 'Cliente'))}
                  {field('Rol', textInput(item.role || '', (v) => updateItemInList('items', idx, 'role', v), 'Comprador verificado'))}
                </div>
              </div>
            ))}
          </Section>
        </div>
      )
    }

    // TEAM
    if (type === 'team') {
      const members = Array.isArray(content.items) ? content.items : []
      return (
        <div className="space-y-4">
          {field('Título', textInput(content.title || '', (v) => handleContentChange('title', v), 'Nuestro Equipo'))}
          <Section
            label="Miembros"
            count={members.length}
            open={isSectionOpen('items')}
            onToggle={() => toggleSection('items')}
            action={
              <button onClick={() => addItemToList('items', { name: 'Nuevo Miembro', role: 'CEO', photo: '' })} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all"><Plus size={11} /> Añadir</button>
            }
          >
            {members.map((m: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Miembro {idx + 1}</span>
                  <button onClick={() => removeItemFromList('items', idx)} className="p-0.5 text-[var(--color-error)] hover:opacity-80"><Trash2 size={12} /></button>
                </div>
                {field('Nombre', textInput(m.name || '', (v) => updateItemInList('items', idx, 'name', v)))}
                {field('Cargo', textInput(m.role || '', (v) => updateItemInList('items', idx, 'role', v), 'CEO / Fundador'))}
                <ImageUploadField
                  label="Foto del miembro"
                  value={m.photo || ''}
                  onChange={(v) => updateItemInList('items', idx, 'photo', v)}
                  previewClass="h-16 w-16 rounded-full"
                  placeholder="https://..."
                />
              </div>
            ))}
          </Section>
        </div>
      )
    }

    // PRICING
    if (type === 'pricing') {
      const plans = Array.isArray(content.plans) ? content.plans : []
      return (
        <div className="space-y-4">
          {field('Título', textInput(content.title || '', (v) => handleContentChange('title', v), 'Planes y Precios'))}
          <Section
            label="Planes"
            count={plans.length}
            open={isSectionOpen('plans')}
            onToggle={() => toggleSection('plans')}
            action={
              <button onClick={() => addItemToList('plans', { name: 'Plan', price: 'S/ 99', features: ['Beneficio 1'], ctaText: 'Elegir Plan', highlight: false })} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all"><Plus size={11} /> Añadir</button>
            }
          >
            {plans.map((plan: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Plan {idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] font-bold text-[var(--color-text-tertiary)] flex items-center gap-1">
                      <input type="checkbox" checked={!!plan.highlight} onChange={(e) => updateItemInList('plans', idx, 'highlight', e.target.checked)} className="accent-[var(--color-accent)]" /> Destacado
                    </label>
                    <button onClick={() => removeItemFromList('plans', idx)} className="p-0.5 text-[var(--color-error)] hover:opacity-80"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {field('Nombre', textInput(plan.name || '', (v) => updateItemInList('plans', idx, 'name', v)))}
                  {field('Precio', textInput(plan.price || '', (v) => updateItemInList('plans', idx, 'price', v), 'S/ 99', true))}
                </div>
                {field('Texto botón', textInput(plan.ctaText || '', (v) => updateItemInList('plans', idx, 'ctaText', v), 'Elegir este Plan'))}
                {field('Beneficios (uno por línea)', (
                  <textarea
                    value={Array.isArray(plan.features) ? plan.features.join('\n') : ''}
                    onChange={(e) => updateItemInList('plans', idx, 'features', e.target.value.split('\n').filter(Boolean))}
                    rows={3}
                    className="textarea-field text-xs font-mono"
                    placeholder={'Beneficio 1\nBeneficio 2'}
                  />
                ))}
              </div>
            ))}
          </Section>
        </div>
      )
    }

    // GALLERY (list of image URLs)
    if (type === 'gallery') {
      const images = Array.isArray(content.images) ? content.images.map((i: any) => (typeof i === 'string' ? i : i.src || i.imageUrl || '')) : []
      return (
        <div className="space-y-4">
          {field('Título', textInput(content.title || '', (v) => handleContentChange('title', v), 'Galería'))}
          <Section
            label="Imágenes"
            count={images.length}
            open={isSectionOpen('images')}
            onToggle={() => toggleSection('images')}
            action={
              <button onClick={() => addItemToList('images', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600')} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all"><Plus size={11} /> Añadir</button>
            }
          >
            {images.map((src: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                {src ? <img src={src} alt="" className="h-10 w-10 rounded-lg border border-[var(--color-border)] object-cover shrink-0" /> : <ImageIcon size={16} className="shrink-0 text-[var(--color-text-tertiary)]" />}
                <input type="text" value={src} onChange={(e) => updateRawItemInList('images', idx, e.target.value)} className="input-field text-xs font-mono flex-1" placeholder="https://.../imagen.jpg" />
                <button onClick={() => removeItemFromList('images', idx)} className="p-1 text-[var(--color-error)] hover:opacity-80 shrink-0"><Trash2 size={12} /></button>
              </div>
            ))}
          </Section>
        </div>
      )
    }

    // SOCIAL PROOF (list of short messages)
    if (type === 'social-proof') {
      const messages = Array.isArray(content.messages) ? content.messages : []
      return (
        <div className="space-y-4">
          <Section
            label="Mensajes"
            count={messages.length}
            open={isSectionOpen('messages')}
            onToggle={() => toggleSection('messages')}
            action={
              <button onClick={() => addItemToList('messages', 'María acaba de comprar un producto 🛍️')} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all"><Plus size={11} /> Añadir</button>
            }
          >
            {messages.map((msg: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="text" value={typeof msg === 'string' ? msg : ''} onChange={(e) => updateRawItemInList('messages', idx, e.target.value)} className="input-field text-xs flex-1" />
                <button onClick={() => removeItemFromList('messages', idx)} className="p-1 text-[var(--color-error)] hover:opacity-80 shrink-0"><Trash2 size={12} /></button>
              </div>
            ))}
          </Section>
        </div>
      )
    }

    // NEWSLETTER
    if (type === 'newsletter') {
      return (
        <div className="space-y-4">
          {field('Título', textInput(content.title || '', (v) => handleContentChange('title', v), 'Únete al Club VIP'))}
          {field('Subtítulo', (
            <textarea value={content.subtitle || ''} onChange={(e) => handleContentChange('subtitle', e.target.value)} rows={2} className="textarea-field text-xs" />
          ))}
          {field('Texto del botón', textInput(content.buttonText || '', (v) => handleContentChange('buttonText', v), 'Quiero Cupones'))}
        </div>
      )
    }

    // COUNTDOWN
    if (type === 'countdown') {
      return (
        <div className="space-y-4">
          {field('Etiqueta', textInput(content.badge || '', (v) => handleContentChange('badge', v), 'Oferta Relámpago'))}
          {field('Título', textInput(content.title || '', (v) => handleContentChange('title', v), 'Hasta 40% OFF'))}
          {field('Subtítulo', (
            <textarea value={content.subtitle || ''} onChange={(e) => handleContentChange('subtitle', e.target.value)} rows={2} className="textarea-field text-xs" />
          ))}
          {field('Fecha límite (ISO)', textInput(content.endDate || '', (v) => handleContentChange('endDate', v), '2026-09-01T23:59:59', true))}
          {field('Texto del botón', textInput(content.buttonText || '', (v) => handleContentChange('buttonText', v), 'Ver Ofertas'))}
        </div>
      )
    }

    // CONTACT
    if (type === 'contact') {
      return (
        <div className="space-y-4">
          {field('Título', textInput(content.title || '', (v) => handleContentChange('title', v), 'Contáctanos'))}
          {field('Dirección', textInput(content.address || '', (v) => handleContentChange('address', v), 'Av. Principal 123, Lima'))}
          {field('Horario', textInput(content.hours || '', (v) => handleContentChange('hours', v), 'Lun a Sáb 9am - 7pm'))}
          {field('Teléfono / WhatsApp', textInput(content.phone || '', (v) => handleContentChange('phone', v), '+51 999 888 777', true))}
          {field('Correo', textInput(content.email || '', (v) => handleContentChange('email', v), 'hola@tienda.com', true))}
        </div>
      )
    }

    // FEATURES (icon + title + description items)
    if (type === 'features') {
      const items = Array.isArray(content.items) ? content.items : []
      return (
        <div className="space-y-4">
          {field('Título', textInput(content.title || '', (v) => handleContentChange('title', v), 'Beneficios Exclusivos'))}
          <Section
            label="Beneficios"
            count={items.length}
            open={isSectionOpen('items')}
            onToggle={() => toggleSection('items')}
            action={
              <button onClick={() => addItemToList('items', { iconName: 'ShieldCheck', title: 'Nuevo Beneficio', description: 'Descripción breve' })} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all"><Plus size={11} /> Añadir</button>
            }
          >
            {items.map((item: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Beneficio {idx + 1}</span>
                  <button onClick={() => removeItemFromList('items', idx)} className="p-0.5 text-[var(--color-error)] hover:opacity-80"><Trash2 size={12} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {field('Ícono', textInput(item.iconName || '', (v) => updateItemInList('items', idx, 'iconName', v), 'Truck', true))}
                  <div className="col-span-2">{field('Título', textInput(item.title || '', (v) => updateItemInList('items', idx, 'title', v)))}</div>
                </div>
                {field('Descripción', (
                  <textarea value={item.description || ''} onChange={(e) => updateItemInList('items', idx, 'description', e.target.value)} rows={2} className="textarea-field text-xs" />
                ))}
              </div>
            ))}
          </Section>
        </div>
      )
    }

    // COLUMNS (multi-column container with nested blocks)
    if (type === 'columns') {
      const cols = Math.max(1, parseInt(String(settings.columns || '2'), 10) || 2)
      const rawItems = Array.isArray(content.items) ? content.items : []
      const items = Array.from({ length: Math.max(cols, rawItems.length) }, (_, i) =>
        rawItems[i] || { width: `${Math.round(100 / cols)}%`, blocks: [] }
      )
      const updateCol = (colIdx: number, newCol: any) => {
        const next = [...items]
        next[colIdx] = newCol
        handleContentChange('items', next)
      }
      const addNestedBlock = (colIdx: number, typeName: string) => {
        const cfg = blockRegistry.get(typeName as any)
        const nb: any = {
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          type: typeName,
          windowId: block.windowId || 'home',
          settings: cfg?.defaultSettings ? JSON.parse(JSON.stringify(cfg.defaultSettings)) : {},
          content: cfg?.defaultContent ? JSON.parse(JSON.stringify(cfg.defaultContent)) : {},
        }
        const col = { ...(items[colIdx] || { width: '50%' }), blocks: [...(items[colIdx]?.blocks || []), nb] }
        updateCol(colIdx, col)
      }
      const removeNestedBlock = (colIdx: number, nbIdx: number) => {
        const col = items[colIdx]
        if (!col) return
        const blocks = [...(col.blocks || [])]
        blocks.splice(nbIdx, 1)
        updateCol(colIdx, { ...col, blocks })
      }
      const moveNestedBlock = (colIdx: number, nbIdx: number, dir: -1 | 1) => {
        const col = items[colIdx]
        if (!col) return
        const blocks = [...(col.blocks || [])]
        const target = nbIdx + dir
        if (target < 0 || target >= blocks.length) return
        const [nb] = blocks.splice(nbIdx, 1)
        blocks.splice(target, 0, nb)
        updateCol(colIdx, { ...col, blocks })
      }
      const handleColumnDrop = (e: React.DragEvent, colIdx: number, beforeNbId?: string, beforeNbIdx?: number) => {
        e.preventDefault()
        setNestedDrag(null)
        setColumnDropTarget(null)
        const payload = readDragPayload(e)
        if (!payload) return
        if (payload.kind === 'nested') {
          // Only blocks dragged from this very columns block can be re-nested here.
          if (payload.parentId !== block.id) return
          if (payload.colIdx === colIdx && payload.nbIdx === beforeNbIdx) return
          const next = moveNestedBetweenColumns(items, payload.colIdx, payload.nbIdx, colIdx, beforeNbIdx)
          if (!next) return
          handleContentChange('items', next)
        } else {
          onDemoteBlock?.(payload.blockId, block.id, colIdx, beforeNbId)
        }
      }
      const nestedTypes = blockRegistry.getAll().filter(c => !['navbar', 'footer', 'columns'].includes(c.id))
      return (
        <div className="space-y-4">
          <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">
            Contenedor de <b>{cols} columnas</b>. Arrastra los bloques <b>entre columnas</b> o suéltalos en la
            lista de la izquierda para <b>subirlos a la página</b>; a la inversa, arrastra un bloque de la lista
            hasta una columna para anidarlo aquí.
          </p>
          <Section
            label="Columnas"
            count={items.length}
            open={isSectionOpen('items')}
            onToggle={() => toggleSection('items')}
          >
            {items.map((col: any, colIdx: number) => (
              <div
                key={colIdx}
                aria-label={`Columna ${colIdx + 1}`}
                className={`p-2.5 rounded-xl border space-y-2 transition-all ${columnDropTarget?.colIdx === colIdx && columnDropTarget?.nbIdx === undefined ? 'border-sky-500 ring-2 ring-sky-500/50 shadow-sm' : 'border-[var(--color-border)] bg-[var(--color-bg-base)]'}`}
              >
                <div className="flex items-center justify-between sticky top-0 z-10 bg-[var(--color-bg-base)]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    Columna {colIdx + 1} · {col.width || `${Math.round(100 / cols)}%`}
                  </span>
                </div>
                {(Array.isArray(col.blocks) ? col.blocks : []).map((nb: any, nbIdx: number) => (
                  <div
                    key={nb.id || nbIdx}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move'
                      setDragPayload(e, { kind: 'nested', blockId: nb.id, parentId: block.id, colIdx, nbIdx })
                      setNestedDrag({ id: nb.id, colIdx, nbIdx })
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      setColumnDropTarget({ colIdx, nbIdx })
                    }}
                    onDrop={(e) => handleColumnDrop(e, colIdx, nb.id, nbIdx)}
                    onDragEnd={() => { setNestedDrag(null); setColumnDropTarget(null) }}
                    className={`flex items-center gap-1.5 border rounded-lg px-2 py-1.5 cursor-grab active:cursor-grabbing transition-all ${nestedDrag?.id === nb.id ? 'opacity-40' : ''} ${columnDropTarget?.colIdx === colIdx && columnDropTarget?.nbIdx === nbIdx ? 'border-sky-500 ring-2 ring-sky-500/70 shadow-sm' : 'border-[var(--color-border)]'}`}
                    style={{ background: 'var(--color-bg-surface)' }}
                    title="Arrastra para mover entre columnas o hasta la lista de la página"
                  >
                    <GripVertical size={11} className="shrink-0 text-[var(--color-text-tertiary)]" />
                    <span className="text-[10px] font-bold capitalize truncate flex-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {nb.type.replace('-', ' ')}
                    </span>
                    <button onClick={() => moveNestedBlock(colIdx, nbIdx, -1)} aria-label={`Subir ${nb.type.replace('-', ' ')}`} className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" title="Subir"><ArrowUp size={11} /></button>
                    <button onClick={() => moveNestedBlock(colIdx, nbIdx, 1)} aria-label={`Bajar ${nb.type.replace('-', ' ')}`} className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" title="Bajar"><ArrowDown size={11} /></button>
                    <button onClick={() => removeNestedBlock(colIdx, nbIdx)} aria-label={`Quitar ${nb.type.replace('-', ' ')}`} className="p-0.5 text-[var(--color-error)] hover:opacity-80" title="Quitar"><Trash2 size={11} /></button>
                  </div>
                ))}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addNestedBlock(colIdx, e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="select-field text-[10px] w-full"
                  title="Añadir bloque a esta columna"
                  aria-label={`Añadir bloque a la columna ${colIdx + 1}`}
                >
                  <option value="">+ Añadir bloque a esta columna…</option>
                  {nestedTypes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setColumnDropTarget({ colIdx })
                  }}
                  onDrop={(e) => handleColumnDrop(e, colIdx)}
                  onDragLeave={(e) => {
                    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setColumnDropTarget(null)
                  }}
                  className={`text-center text-[9px] font-bold uppercase tracking-wider rounded-lg border border-dashed px-2 py-1.5 transition-all ${columnDropTarget?.colIdx === colIdx && columnDropTarget?.nbIdx === undefined ? 'border-sky-500 text-sky-500 bg-sky-500/10' : 'border-[var(--color-border)] text-[var(--color-text-tertiary)]'}`}
                >
                  ⇩ Soltar aquí (añadir al final)
                </div>
              </div>
            ))}
          </Section>
        </div>
      )
    }

    // IMAGE
    if (type === 'image') {
      return (
        <div className="space-y-4">
          <ImageUploadField
            label="Imagen"
            value={content.src || content.imageUrl || ''}
            onChange={(v) => handleContentChange('src', v)}
            previewClass="h-24 w-full"
            placeholder="https://.../imagen.jpg"
          />
          {field('Texto alternativo (alt)', textInput(content.alt || '', (v) => handleContentChange('alt', v), 'Descripción de la imagen'))}
          {field('Pie de foto (caption)', textInput(content.caption || '', (v) => handleContentChange('caption', v), 'Opcional'))}
          {field('Enlace (link)', textInput(content.link || '', (v) => handleContentChange('link', v), 'https://...', true))}
        </div>
      )
    }

    // TEXT
    if (type === 'text') {
      return (
        <div className="space-y-4">
          {field('Título (según variante)', textInput(content.title || '', (v) => handleContentChange('title', v), 'Título opcional'))}
          {field('Contenido', (
            <textarea value={content.text || ''} onChange={(e) => handleContentChange('text', e.target.value)} rows={7} className="textarea-field text-xs" placeholder="Escribe aquí... **negrita**, *cursiva*" />
          ))}
          <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">
            Formato: <code>**negrita**</code> y <code>*cursiva*</code>. La variante (párrafo, título + texto, cita) y la alineación se ajustan en <b>Estilos</b>.
          </p>
        </div>
      )
    }

    // CALENDAR (agenda de citas — landing)
    if (type === 'calendar') {
      const hoursStr = Array.isArray(content.hours) ? content.hours.join(', ') : String(content.hours || '')
      return (
        <div className="space-y-4">
          {field('Título', textInput(content.title || '', (v) => handleContentChange('title', v), 'Agenda tu sesión gratuita'))}
          {field('Subtítulo', (
            <textarea value={content.subtitle || ''} onChange={(e) => handleContentChange('subtitle', e.target.value)} rows={2} className="textarea-field text-xs" />
          ))}
          {field('Texto del botón', textInput(content.buttonLabel || '', (v) => handleContentChange('buttonLabel', v), 'Confirmar reserva'))}
          {field('Integración de agenda', (
            <select value={content.integration || 'internal'} onChange={(e) => handleContentChange('integration', e.target.value)} className="select-field text-xs w-full">
              <option value="internal">Agenda interna (slots en la BD de la tienda)</option>
              <option value="calendly">Calendly (embed externo)</option>
              <option value="google">Google Calendar (reserva interna + enlace al evento)</option>
            </select>
          ))}
          {(content.integration === 'calendly') && field('URL de Calendly', textInput(content.bookingUrl || '', (v) => handleContentChange('bookingUrl', v), 'https://calendly.com/tu-usuario', true), 'Se incrusta el calendario real de Calendly en la página.')}
          {field('Duración de la cita', (
            <select value={String(content.duration || '30')} onChange={(e) => handleContentChange('duration', e.target.value)} className="select-field text-xs w-full">
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
            </select>
          ))}
          {field('Email de notificación (vacío = dueños de la tienda)', textInput(content.notificationEmail || '', (v) => handleContentChange('notificationEmail', v), 'ventas@mitienda.com', true), 'Se avisa por email cada vez que alguien reserva.')}
          {field('WhatsApp de notificación (vacío = número del bloque)', textInput(content.notificationWhatsapp || '', (v) => handleContentChange('notificationWhatsapp', v), '51999999999', true), 'Recibe el aviso de cada reserva por WhatsApp.')}
          {field('WhatsApp de la tienda (contacto)', textInput(content.whatsappNumber || '', (v) => handleContentChange('whatsappNumber', v), '51999999999', true))}
          {field('Horarios disponibles', textInput(hoursStr, (v) => handleContentChange('hours', v.split(',').map((h: string) => h.trim()).filter(Boolean)), '09:00, 10:00, 11:00, 16:00, 17:00'), 'Separados por coma')}
          {field('Nota al pie', textInput(content.note || '', (v) => handleContentChange('note', v), 'Sesión de 30 minutos · Sin compromiso'))}
        </div>
      )
    }

    // VSL (video sales letter — landing)
    if (type === 'vsl') {
      return (
        <div className="space-y-4">
          {field('Etiqueta superior', textInput(content.badge || '', (v) => handleContentChange('badge', v), '▶ Video explicativo'))}
          {field('Titular', textInput(content.headline || '', (v) => handleContentChange('headline', v), 'Mira este video de 5 minutos'))}
          {field('URL del video', textInput(content.videoUrl || '', (v) => handleContentChange('videoUrl', v), 'https://www.youtube.com/watch?v=...', true), 'YouTube, Vimeo o MP4 directo')}
          <ImageUploadField
            label="Imagen de portada"
            value={content.thumbnailUrl || ''}
            onChange={(v) => handleContentChange('thumbnailUrl', v)}
            previewClass="h-20 w-full"
            placeholder="Opcional — si está vacía se usa un fondo oscuro"
          />
          {field('Texto del botón', textInput(content.ctaText || '', (v) => handleContentChange('ctaText', v), 'Quiero empezar ahora'))}
          {field('Destino del botón', textInput(content.ctaUrl || '', (v) => handleContentChange('ctaUrl', v), '#cta', true), 'Enlace, ancla (#seccion) o ventana')}
        </div>
      )
    }

    // ARTICLES (blog corporativo — corporate)
    if (type === 'articles') {
      const articles = Array.isArray(content.articles) ? content.articles : []
      const updateArticle = (idx: number, patch: any) => {
        const next = articles.map((a: any, i: number) => (i === idx ? { ...a, ...patch } : a))
        handleContentChange('articles', next)
      }
      const removeArticle = (idx: number) => {
        const next = articles.filter((_: any, i: number) => i !== idx)
        handleContentChange('articles', next)
      }
      const addArticle = () => {
        handleContentChange('articles', [
          ...articles,
          { id: `a${Date.now()}`, title: 'Nuevo artículo', excerpt: '', date: new Date().toISOString().slice(0, 10), imageUrl: '', link: '#', tag: 'Nuevo' },
        ])
      }
      const isBlogSource = content.source === 'blog'
      return (
        <div className="space-y-4">
          {field('Fuente de artículos', (
            <select
              value={content.source || 'static'}
              onChange={(e) => handleContentChange('source', e.target.value)}
              className="select-field text-xs"
            >
              <option value="blog">Posts reales del blog (gestor de blog)</option>
              <option value="static">Artículos manuales (editor)</option>
            </select>
          ))}
          {isBlogSource && (
            <div className="p-3 rounded-xl border border-blue-500/25 bg-blue-500/5 text-[11px] leading-relaxed">
              Este bloque muestra automáticamente los artículos <b>publicados</b> en el <b>gestor de blog</b> de esta tienda
              (menú <b>Blog</b>), enlazando a su URL pública <span className="font-mono">/blog/[slug]</span>.
              Gestiona los artículos desde <b>Blog → Artículos</b>.
            </div>
          )}
          {field('Título de la sección', textInput(content.title || '', (v) => handleContentChange('title', v), 'Últimas publicaciones'))}
          {field('Subtítulo', (
            <textarea value={content.subtitle || ''} onChange={(e) => handleContentChange('subtitle', e.target.value)} rows={2} className="textarea-field text-xs" />
          ))}
          {isBlogSource ? null : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label text-[11px] font-bold">Artículos ({articles.length})</label>
              <button onClick={addArticle} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-[var(--color-accent)] text-white hover:opacity-85">
                <Plus size={10} /> Añadir artículo
              </button>
            </div>
            {articles.length === 0 && (
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Sin artículos todavía. Añade el primero.</p>
            )}
            {articles.map((a: any, idx: number) => (
              <div key={a.id || idx} className="p-3 rounded-xl border border-[var(--color-border)] space-y-2 mb-2" style={{ background: 'var(--color-bg-base)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Artículo {idx + 1}</span>
                  <button onClick={() => removeArticle(idx)} className="p-1 text-[var(--color-error)] hover:opacity-75" title="Eliminar"><Trash2 size={11} /></button>
                </div>
                <ImageUploadField
                  label="Imagen"
                  value={a.imageUrl || ''}
                  onChange={(v) => updateArticle(idx, { imageUrl: v })}
                  previewClass="h-16 w-full"
                  placeholder="https://.../portada.jpg"
                />
                {field('Título', textInput(a.title || '', (v) => updateArticle(idx, { title: v })))}
                {field('Resumen', (
                  <textarea value={a.excerpt || ''} onChange={(e) => updateArticle(idx, { excerpt: e.target.value })} rows={2} className="textarea-field text-xs" />
                ))}
                <div className="grid grid-cols-2 gap-2">
                  {field('Etiqueta', textInput(a.tag || '', (v) => updateArticle(idx, { tag: v }), 'Guías'))}
                  {field('Fecha', textInput(a.date || '', (v) => updateArticle(idx, { date: v }), '2026-01-01'))}
                </div>
                {field('Enlace del artículo', textInput(a.link || '', (v) => updateArticle(idx, { link: v }), 'https://...', true))}
              </div>
            ))}
          </div>
          )}
        </div>
      )
    }

    // FOOTER (configurable: columnas de enlaces, redes, variantes)
    if (type === 'footer') {
      const cols: any[] = Array.isArray(content.columns) ? content.columns : []
      const socials: any[] = Array.isArray(content.socialLinks) ? content.socialLinks : []
      const updateCol = (ci: number, patch: any) => {
        const next = cols.map((col: any, i: number) => (i === ci ? { ...col, ...patch } : col))
        handleContentChange('columns', next)
      }
      const updateColLink = (ci: number, li: number, patch: any) => {
        const links = Array.isArray(cols[ci]?.links) ? cols[ci].links : []
        const nextLinks = links.map((l: any, i: number) => (i === li ? { ...l, ...patch } : l))
        updateCol(ci, { links: nextLinks })
      }
      const addColLink = (ci: number) => {
        const links = Array.isArray(cols[ci]?.links) ? cols[ci].links : []
        updateCol(ci, { links: [...links, { label: 'Nuevo enlace', url: '#' }] })
      }
      const removeColLink = (ci: number, li: number) => {
        const links = Array.isArray(cols[ci]?.links) ? cols[ci].links : []
        updateCol(ci, { links: links.filter((_: any, i: number) => i !== li) })
      }
      const updateSocial = (si: number, patch: any) => {
        const next = socials.map((sc: any, i: number) => (i === si ? { ...sc, ...patch } : sc))
        handleContentChange('socialLinks', next)
      }
      return (
        <div className="space-y-4">
          {field('Nombre de la marca', textInput(content.companyName || content.brandName || '', (v) => handleContentChange('companyName', v), 'Mi Empresa'))}
          {field('Frase (tagline)', textInput(content.tagline || '', (v) => handleContentChange('tagline', v), 'Construyendo el futuro, paso a paso'))}
          {field('Copyright', textInput(content.copyright || '', (v) => handleContentChange('copyright', v), '© 2026 Mi Empresa. Todos los derechos reservados.'))}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label text-[11px] font-bold">Columnas de enlaces ({cols.length})</label>
              <button
                onClick={() => handleContentChange('columns', [...cols, { title: 'Nueva sección', links: [{ label: 'Enlace', url: '#' }] }])}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-[var(--color-accent)] text-white hover:opacity-85"
              >
                <Plus size={10} /> Añadir columna
              </button>
            </div>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mb-2">
              Los enlaces con <code>#/ventana/…</code> navegan a otra ventana de la tienda; los demás van como enlace normal.
            </p>
            {cols.length === 0 && <p className="text-[10px] text-[var(--color-text-tertiary)]">Sin columnas todavía.</p>}
            {cols.map((col: any, ci: number) => (
              <div key={ci} className="p-3 rounded-xl border border-[var(--color-border)] space-y-2 mb-2" style={{ background: 'var(--color-bg-base)' }}>
                <div className="flex items-center gap-2">
                  <input
                    value={col.title || ''}
                    onChange={(e) => updateCol(ci, { title: e.target.value })}
                    className="input-field text-xs flex-1"
                    placeholder="Título de la columna"
                  />
                  <button
                    onClick={() => handleContentChange('columns', cols.filter((_: any, i: number) => i !== ci))}
                    className="p-1 text-[var(--color-error)] hover:opacity-75"
                    title="Eliminar columna"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                {(Array.isArray(col.links) ? col.links : []).map((l: any, li: number) => (
                  <div key={li} className="grid grid-cols-5 gap-1.5 items-center">
                    <input
                      value={l.label || ''}
                      onChange={(e) => updateColLink(ci, li, { label: e.target.value })}
                      className="input-field text-[10px] col-span-2"
                      placeholder="Texto"
                    />
                    <input
                      value={l.url || ''}
                      onChange={(e) => updateColLink(ci, li, { url: e.target.value })}
                      className="input-field text-[10px] col-span-2"
                      placeholder="# o https://… o #/ventana/…"
                    />
                    <button onClick={() => removeColLink(ci, li)} className="p-1 text-[var(--color-error)] hover:opacity-75" title="Quitar enlace">
                      <X size={11} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addColLink(ci)} className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-accent)] hover:opacity-80">
                  <Plus size={10} /> Añadir enlace
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="form-label text-[11px] font-bold">Redes sociales</label>
            {socials.map((sc: any, si: number) => (
              <div key={si} className="grid grid-cols-5 gap-1.5 items-center mb-1.5">
                <select
                  value={sc.platform || ''}
                  onChange={(e) => updateSocial(si, { platform: e.target.value })}
                  className="select-field text-[10px] col-span-2"
                >
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="tiktok">TikTok</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="twitter">X / Twitter</option>
                </select>
                <input
                  value={sc.url || ''}
                  onChange={(e) => updateSocial(si, { url: e.target.value })}
                  className="input-field text-[10px] col-span-2"
                  placeholder="https://…"
                />
                <button
                  onClick={() => handleContentChange('socialLinks', socials.filter((_: any, i: number) => i !== si))}
                  className="p-1 text-[var(--color-error)] hover:opacity-75"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            <button
              onClick={() => handleContentChange('socialLinks', [...socials, { platform: 'instagram', url: '#' }])}
              className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-accent)] hover:opacity-80"
            >
              <Plus size={10} /> Añadir red social
            </button>
          </div>
        </div>
      )
    }

    // CTA (botón de conversión con destino configurable)
    if (type === 'cta') {
      return (
        <div className="space-y-4">
          {field('Título', textInput(content.title || '', (v) => handleContentChange('title', v), '¿Listo para empezar?'))}
          {field('Subtítulo', (
            <textarea value={content.subtitle || ''} onChange={(e) => handleContentChange('subtitle', e.target.value)} rows={2} className="textarea-field text-xs" />
          ))}
          {field('Texto del botón', textInput(content.buttonText || '', (v) => handleContentChange('buttonText', v), 'Empezar ahora'))}
          <LinkField
            label="Destino del botón"
            value={content.buttonLink}
            onChange={(v) => handleContentChange('buttonLink', v)}
            windows={windows}
            hint="Ventana de la tienda, ancla de la misma página, URL externa o WhatsApp"
          />
        </div>
      )
    }

    // Generic fallback: title / subtitle / body / buttons
    return (
      <div className="space-y-4">
        {content.title !== undefined && field('Título Principal', textInput(content.title || '', (v) => handleContentChange('title', v)))}
        {content.subtitle !== undefined && field('Subtítulo / Bajada', (
          <textarea value={content.subtitle || ''} onChange={(e) => handleContentChange('subtitle', e.target.value)} rows={2} className="textarea-field text-xs" />
        ))}
        {content.body !== undefined && field('Cuerpo de Texto', (
          <textarea value={content.body || ''} onChange={(e) => handleContentChange('body', e.target.value)} rows={4} className="textarea-field text-xs" />
        ))}
        {content.badge !== undefined && field('Etiqueta / Badge', textInput(content.badge || '', (v) => handleContentChange('badge', v)))}
        {content.buttonText !== undefined && field('Texto Botón Principal', textInput(content.buttonText || '', (v) => handleContentChange('buttonText', v)))}
        {content.secondaryButtonText !== undefined && field('Texto Botón Secundario', textInput(content.secondaryButtonText || '', (v) => handleContentChange('secondaryButtonText', v)))}
        {content.buttonUrl !== undefined && field('URL del Botón', textInput(content.buttonUrl || '', (v) => handleContentChange('buttonUrl', v), 'https://...', true))}
        {content.ctaLabel !== undefined && field('Texto del CTA', textInput(content.ctaLabel || '', (v) => handleContentChange('ctaLabel', v)))}
        {content.description !== undefined && field('Descripción', (
          <textarea value={content.description || ''} onChange={(e) => handleContentChange('description', e.target.value)} rows={3} className="textarea-field text-xs" />
        ))}
        {content.imageUrl !== undefined && field('Imagen (URL)', textInput(content.imageUrl || '', (v) => handleContentChange('imageUrl', v), 'https://...', true))}
        <p className="text-[10px] text-[var(--color-text-tertiary)]">No hay editor especializado para este bloque. Edita las propiedades genéricas disponibles.</p>
      </div>
    )
  }

  const windowId = block.windowId || 'home'

  return (
    <div className="w-80 xl:w-88 border-l border-[var(--color-border)] bg-[var(--color-bg-surface)] flex flex-col h-full overflow-hidden text-xs">
      <style>{`
        @keyframes editorFieldPulse { 0% { box-shadow: 0 0 0 0 rgba(168,85,247,0.5); } 100% { box-shadow: 0 0 0 7px rgba(168,85,247,0); } }
        .editor-field-focus { animation: editorFieldPulse 1.1s ease-out 2; border-radius: 10px; outline: 2px solid rgba(168,85,247,0.6); outline-offset: 2px; transition: outline-color .2s; }
      `}</style>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between shrink-0" style={{ background: 'var(--color-bg-base)' }}>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs capitalize text-[var(--color-text-primary)]">{type.replace('-', ' ')}</span>
          </div>
          <p className="text-[10px] text-[var(--color-text-tertiary)]">ID: {block.id.slice(0, 8)}</p>
        </div>

        <div className="flex items-center gap-1">
          {onGenerateAI && (
            <button
              onClick={async () => {
                setGenerating(true)
                try { await onGenerateAI(type) } finally { setGenerating(false) }
              }}
              disabled={generating}
              className="p-1.5 text-[var(--color-accent)] bg-[var(--color-accent-muted)] hover:opacity-80 rounded-lg transition-all disabled:opacity-50"
              title="Mejorar con IA"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={onDuplicate} className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors" title="Duplicar Bloque">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-[var(--color-error)] hover:bg-[var(--color-error-muted)] rounded-lg transition-colors" title="Eliminar Bloque">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window selector */}
      <div className="px-4 py-3 border-b border-[var(--color-border)] shrink-0" style={{ background: 'var(--color-bg-base)' }}>
        <label className="form-label text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Ventana donde se muestra</label>
        <select
          value={windowId}
          onChange={(e) => onWindowChange(e.target.value)}
          className="select-field text-xs w-full mt-1"
        >
          {windows.map(w => (
            <option key={w} value={w}>{WINDOW_LABELS[w] || `🪟 ${w}`}</option>
          ))}
          {!windows.includes(windowId) && <option value={windowId}>{WINDOW_LABELS[windowId] || `🪟 ${windowId}`}</option>}
        </select>
        <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
          Las ventanas separan el contenido: Inicio, Catálogo, Ofertas y cada producto tiene su propia página.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] shrink-0" style={{ background: 'var(--color-bg-surface)' }}>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-2.5 font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'content'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Type size={13} /> Contenido
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-2.5 font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'style'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Palette size={13} /> Estilos
        </button>
      </div>

      {/* Content / Style forms */}
      <div ref={scrollRef} onScroll={handleEditorScroll} className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'content' ? renderContentEditors() : (
          <div className="space-y-4">
            {/* Universal design & responsive panel — available for every block */}
            <div className="p-3 rounded-xl border border-[var(--color-border)] space-y-3" style={{ background: 'var(--color-bg-base)' }}>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                <Maximize2 size={11} /> Diseño &amp; Responsive
              </p>

              {field('Ancho del bloque', (
                <select value={settings.blockWidth || 'full'} onChange={(e) => handleSettingChange('blockWidth', e.target.value)} className="select-field text-xs w-full">
                  <option value="full">Ancho completo</option>
                  <option value="wide">Contenido ancho (máx. 1024px)</option>
                  <option value="medium">Contenido medio (máx. 768px)</option>
                  <option value="narrow">Contenido estrecho (máx. 576px)</option>
                </select>
              ), 'Limita el ancho de esta sección y la centra. Pruébalo en los distintos dispositivos del lienzo.')}

              <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--color-border)]">
                <span className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <Smartphone size={12} /> Ocultar en móvil
                </span>
                <input type="checkbox" checked={settings.hideMobile === true} onChange={(e) => handleSettingChange('hideMobile', e.target.checked)} className="w-4 h-4" />
              </label>
              <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--color-border)]">
                <span className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <Monitor size={12} /> Solo escritorio
                </span>
                <input type="checkbox" checked={settings.hideTablet === true} onChange={(e) => handleSettingChange('hideTablet', e.target.checked)} className="w-4 h-4" />
              </label>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">
                «Ocultar en móvil» esconde la sección en pantallas &lt; 768px; «Solo escritorio» la muestra únicamente en &ge; 1024px. Se aplica igual en el editor y en la web pública.
              </p>

              <div className="pt-2 border-t border-[var(--color-border)]">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2 flex items-center gap-1.5">
                  <MoveVertical size={11} /> Espaciado fino
                </p>
                <div className="flex gap-2">
                  <SpacingSlider label="Arriba" value={typeof settings.paddingTop === 'number' ? settings.paddingTop : undefined} max={160} onChange={(v) => handleSettingChange('paddingTop', v)} />
                  <SpacingSlider label="Abajo" value={typeof settings.paddingBottom === 'number' ? settings.paddingBottom : undefined} max={160} onChange={(v) => handleSettingChange('paddingBottom', v)} />
                  <SpacingSlider label="Horizontal" value={typeof settings.paddingX === 'number' ? settings.paddingX : undefined} max={120} onChange={(v) => handleSettingChange('paddingX', v)} />
                </div>
                {field('Radio de esquinas', (
                  <select value={settings.borderRadius || '0px'} onChange={(e) => handleSettingChange('borderRadius', e.target.value)} className="select-field text-xs w-full mt-2">
                    <option value="0px">Sin redondeo</option>
                    <option value="8px">Suave (8px)</option>
                    <option value="12px">Medio (12px)</option>
                    <option value="16px">Grande (16px)</option>
                    <option value="24px">Muy grande (24px)</option>
                    <option value="9999px">Completamente redondeado</option>
                  </select>
                ), 'Redondea las esquinas de toda la sección (visible si tiene fondo o borde).')}
                {(settings.paddingTop !== undefined || settings.paddingBottom !== undefined || settings.paddingX !== undefined || settings.borderRadius !== undefined) && (
                  <button
                    onClick={() => {
                      handleSettingChange('paddingTop', undefined)
                      handleSettingChange('paddingBottom', undefined)
                      handleSettingChange('paddingX', undefined)
                      handleSettingChange('borderRadius', undefined)
                    }}
                    className="w-full mt-2 py-1.5 text-[10px] font-bold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
                  >
                    Restablecer espaciado y radio
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-[var(--color-border)] space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                  <PaintBucket size={11} /> Superficie &amp; Borde
                </p>
                <div>
                  <label className="form-label text-[11px] font-bold">Color de fondo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.bgColor || '#f1f5f9'}
                      onChange={(e) => handleSettingChange('bgColor', e.target.value)}
                      className="w-8 h-8 rounded-lg border border-[var(--color-border)] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.bgColor || ''}
                      onChange={(e) => handleSettingChange('bgColor', e.target.value)}
                      placeholder="#f1f5f9"
                      className="input-field text-xs font-mono flex-1"
                    />
                  </div>
                </div>
                <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--color-border)]">
                  <span className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    <Droplets size={12} /> Usar degradado
                  </span>
                  <input type="checkbox" checked={settings.bgGradient === true} onChange={(e) => handleSettingChange('bgGradient', e.target.checked)} className="w-4 h-4" />
                </label>
                <div>
                  <label className="form-label text-[11px] font-bold">Presets</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {GRADIENT_PRESETS.map(p => {
                      const isActive = settings.bgGradient === true && settings.bgGradientFrom === p.from && settings.bgGradientTo === p.to && settings.bgGradientDirection === p.dir
                      return (
                        <button
                          key={p.name}
                          type="button"
                          title={p.name}
                          onClick={() => {
                            handleSettingChange('bgGradient', true)
                            handleSettingChange('bgGradientFrom', p.from)
                            handleSettingChange('bgGradientTo', p.to)
                            handleSettingChange('bgGradientDirection', p.dir)
                          }}
                          className={`relative h-9 min-w-0 rounded-lg border overflow-hidden group transition-all ${isActive ? 'ring-2 ring-[var(--color-accent)]' : 'border-[var(--color-border)] hover:scale-105'}`}
                          style={{ backgroundImage: `linear-gradient(${p.dir}, ${p.from}, ${p.to})` }}
                        >
                          <span className="absolute inset-x-0 bottom-0 py-0.5 text-center text-[8px] font-bold text-white bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                            {p.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {settings.bgGradient === true && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="form-label text-[11px] font-bold">Desde</label>
                        <input
                          type="color"
                          value={settings.bgGradientFrom || '#f1f5f9'}
                          onChange={(e) => handleSettingChange('bgGradientFrom', e.target.value)}
                          className="w-full h-8 rounded-lg border border-[var(--color-border)] cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="form-label text-[11px] font-bold">Hasta</label>
                        <input
                          type="color"
                          value={settings.bgGradientTo || '#e2e8f0'}
                          onChange={(e) => handleSettingChange('bgGradientTo', e.target.value)}
                          className="w-full h-8 rounded-lg border border-[var(--color-border)] cursor-pointer"
                        />
                      </div>
                    </div>
                    {field('Dirección', (
                      <select value={settings.bgGradientDirection || 'to bottom'} onChange={(e) => handleSettingChange('bgGradientDirection', e.target.value)} className="select-field text-xs w-full">
                        <option value="to bottom">Hacia abajo</option>
                        <option value="to top">Hacia arriba</option>
                        <option value="to right">Hacia la derecha</option>
                        <option value="to left">Hacia la izquierda</option>
                        <option value="to bottom right">Diagonal ↘</option>
                        <option value="to bottom left">Diagonal ↙</option>
                        <option value="to top right">Diagonal ↗</option>
                        <option value="to top left">Diagonal ↖</option>
                        <option value="135deg">Ángulo 135°</option>
                      </select>
                    ))}
                  </div>
                )}
                <SpacingSlider label="Opacidad del fondo" value={typeof settings.bgOpacity === 'number' ? settings.bgOpacity : undefined} max={100} onChange={(v) => handleSettingChange('bgOpacity', v)} />
                <div className="pt-2 border-t border-[var(--color-border)]">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <SpacingSlider label="Grosor del borde" value={typeof settings.borderWidth === 'number' ? settings.borderWidth : undefined} max={16} onChange={(v) => handleSettingChange('borderWidth', v)} />
                    </div>
                    <div className="flex-1">
                      <label className="form-label text-[11px] font-bold">Estilo</label>
                      <select value={settings.borderStyle || 'solid'} onChange={(e) => handleSettingChange('borderStyle', e.target.value)} className="select-field text-xs w-full">
                        <option value="solid">Sólido</option>
                        <option value="dashed">Discontinuo</option>
                        <option value="dotted">Punteado</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="form-label text-[11px] font-bold">Color del borde</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.borderColor || '#e2e8f0'}
                        onChange={(e) => handleSettingChange('borderColor', e.target.value)}
                        className="w-8 h-8 rounded-lg border border-[var(--color-border)] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.borderColor || ''}
                        onChange={(e) => handleSettingChange('borderColor', e.target.value)}
                        placeholder="#e2e8f0"
                        className="input-field text-xs font-mono flex-1"
                      />
                    </div>
                  </div>
                </div>
                {(settings.bgColor !== undefined || settings.bgOpacity !== undefined || settings.bgGradient !== undefined || settings.bgGradientFrom !== undefined || settings.bgGradientTo !== undefined || settings.bgGradientDirection !== undefined || settings.borderColor !== undefined || settings.borderWidth !== undefined || settings.borderStyle !== undefined) && (
                  <button
                    onClick={() => {
                      handleSettingChange('bgColor', undefined)
                      handleSettingChange('bgOpacity', undefined)
                      handleSettingChange('bgGradient', undefined)
                      handleSettingChange('bgGradientFrom', undefined)
                      handleSettingChange('bgGradientTo', undefined)
                      handleSettingChange('bgGradientDirection', undefined)
                      handleSettingChange('borderColor', undefined)
                      handleSettingChange('borderWidth', undefined)
                      handleSettingChange('borderStyle', undefined)
                    }}
                    className="w-full py-1.5 text-[10px] font-bold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] flex items-center justify-center gap-1.5"
                  >
                    <Square size={11} /> Restablecer fondo y borde
                  </button>
                )}
              </div>
            </div>

            {(type === 'columns' || type === 'image' || type === 'text' || type === 'calendar' || type === 'vsl' || type === 'articles' || type === 'footer') && (
              <div className="p-3 rounded-xl border border-[var(--color-border)] space-y-3" style={{ background: 'var(--color-bg-base)' }}>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Configuración específica del bloque</p>

                {type === 'columns' && (<>
                  {field('Número de columnas', (
                    <select value={String(settings.columns || '2')} onChange={(e) => handleSettingChange('columns', e.target.value)} className="select-field text-xs w-full">
                      <option value="2">2 columnas</option>
                      <option value="3">3 columnas</option>
                      <option value="4">4 columnas</option>
                    </select>
                  ))}
                  {field('Separación entre columnas (gap)', (
                    <select value={settings.gap || '32px'} onChange={(e) => handleSettingChange('gap', e.target.value)} className="select-field text-xs w-full">
                      <option value="16px">Pequeña (16px)</option>
                      <option value="32px">Media (32px)</option>
                      <option value="48px">Grande (48px)</option>
                    </select>
                  ))}
                  {field('Alineación vertical', (
                    <select value={settings.verticalAlign || 'top'} onChange={(e) => handleSettingChange('verticalAlign', e.target.value)} className="select-field text-xs w-full">
                      <option value="top">Arriba</option>
                      <option value="center">Centro</option>
                      <option value="bottom">Abajo</option>
                    </select>
                  ))}
                </>)}

                {type === 'image' && (<>
                  {field('Variante', (
                    <select value={settings.variant || 'full'} onChange={(e) => handleSettingChange('variant', e.target.value)} className="select-field text-xs w-full">
                      <option value="full">Ancho completo</option>
                      <option value="contained">Contenido (centrada)</option>
                      <option value="caption">Con pie de foto</option>
                      <option value="background">Fondo</option>
                    </select>
                  ))}
                  {field('Ancho', (
                    <select value={settings.width || '100%'} onChange={(e) => handleSettingChange('width', e.target.value)} className="select-field text-xs w-full">
                      <option value="100%">100%</option>
                      <option value="75%">75%</option>
                      <option value="50%">50%</option>
                      <option value="25%">25%</option>
                    </select>
                  ))}
                  {field('Ajuste (object-fit)', (
                    <select value={settings.objectFit || 'cover'} onChange={(e) => handleSettingChange('objectFit', e.target.value)} className="select-field text-xs w-full">
                      <option value="cover">Cubrir (cover)</option>
                      <option value="contain">Contener (contain)</option>
                    </select>
                  ))}
                  {field('Esquinas redondeadas', (
                    <select value={settings.borderRadius || '0px'} onChange={(e) => handleSettingChange('borderRadius', e.target.value)} className="select-field text-xs w-full">
                      <option value="0px">Sin redondeo</option>
                      <option value="8px">8px</option>
                      <option value="12px">12px</option>
                      <option value="16px">16px</option>
                      <option value="9999px">Completamente redondeada</option>
                    </select>
                  ))}
                </>)}

                {type === 'text' && (<>
                  {field('Variante', (
                    <select value={settings.variant || 'paragraph'} onChange={(e) => handleSettingChange('variant', e.target.value)} className="select-field text-xs w-full">
                      <option value="paragraph">Párrafo</option>
                      <option value="heading-text">Título + texto</option>
                      <option value="quote">Cita</option>
                    </select>
                  ))}
                  {field('Alineación', (
                    <select value={settings.textAlign || 'left'} onChange={(e) => handleSettingChange('textAlign', e.target.value)} className="select-field text-xs w-full">
                      <option value="left">Izquierda</option>
                      <option value="center">Centro</option>
                      <option value="right">Derecha</option>
                    </select>
                  ))}
                  {field('Ancho máximo', (
                    <select value={settings.maxWidth || '800px'} onChange={(e) => handleSettingChange('maxWidth', e.target.value)} className="select-field text-xs w-full">
                      <option value="600px">Estrecho (600px)</option>
                      <option value="800px">Medio (800px)</option>
                      <option value="1000px">Ancho (1000px)</option>
                      <option value="100%">Ancho completo</option>
                    </select>
                  ))}
                </>)}

                {type === 'calendar' && (<>
                  {field('Columnas de horarios', (
                    <select value={String(settings.columns || '2')} onChange={(e) => handleSettingChange('columns', e.target.value)} className="select-field text-xs w-full">
                      <option value="2">2 columnas</option>
                      <option value="3">3 columnas</option>
                    </select>
                  ))}
                  {field('Color de acento', (
                    <input type="color" value={settings.accentColor || '#f59e0b'} onChange={(e) => handleSettingChange('accentColor', e.target.value)} className="w-10 h-8 rounded-lg border border-[var(--color-border)] cursor-pointer" />
                  ))}
                </>)}

                {type === 'vsl' && (<>
                  {field('Esquinas del video', (
                    <select value={settings.rounded || '16px'} onChange={(e) => handleSettingChange('rounded', e.target.value)} className="select-field text-xs w-full">
                      <option value="16px">Redondeadas</option>
                      <option value="28px">Muy redondeadas</option>
                      <option value="0px">Rectas</option>
                    </select>
                  ))}
                  <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--color-border)]">
                    <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>Reproducción automática (autoplay)</span>
                    <input type="checkbox" checked={settings.autoplay === true} onChange={(e) => handleSettingChange('autoplay', e.target.checked)} className="w-4 h-4" />
                  </label>
                  {field('Color de acento', (
                    <input type="color" value={settings.accentColor || '#f43f5e'} onChange={(e) => handleSettingChange('accentColor', e.target.value)} className="w-10 h-8 rounded-lg border border-[var(--color-border)] cursor-pointer" />
                  ))}
                </>)}

                {type === 'articles' && (<>
                  {field('Columnas', (
                    <select value={String(settings.columns || '3')} onChange={(e) => handleSettingChange('columns', e.target.value)} className="select-field text-xs w-full">
                      <option value="2">2 columnas</option>
                      <option value="3">3 columnas</option>
                      <option value="4">4 columnas</option>
                    </select>
                  ))}
                  <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--color-border)]">
                    <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>Mostrar fecha</span>
                    <input type="checkbox" checked={settings.showDate !== false} onChange={(e) => handleSettingChange('showDate', e.target.checked)} className="w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--color-border)]">
                    <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>Mostrar "Leer más"</span>
                    <input type="checkbox" checked={settings.showReadMore !== false} onChange={(e) => handleSettingChange('showReadMore', e.target.checked)} className="w-4 h-4" />
                  </label>
                  {field('Color de acento', (
                    <input type="color" value={settings.accentColor || '#2563eb'} onChange={(e) => handleSettingChange('accentColor', e.target.value)} className="w-10 h-8 rounded-lg border border-[var(--color-border)] cursor-pointer" />
                  ))}
                </>)}

                {type === 'footer' && (<>
                  {field('Disposición', (
                    <select value={settings.variant || 'standard'} onChange={(e) => handleSettingChange('variant', e.target.value)} className="select-field text-xs w-full">
                      <option value="standard">Estándar (marca + columnas)</option>
                      <option value="centered">Centrada (marca + redes)</option>
                      <option value="minimal">Mínima (solo marca)</option>
                    </select>
                  ))}
                  <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--color-border)]">
                    <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>Mostrar logo</span>
                    <input type="checkbox" checked={settings.showLogo !== false} onChange={(e) => handleSettingChange('showLogo', e.target.checked)} className="w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--color-border)]">
                    <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>Mostrar redes sociales</span>
                    <input type="checkbox" checked={settings.showSocial !== false} onChange={(e) => handleSettingChange('showSocial', e.target.checked)} className="w-4 h-4" />
                  </label>
                </>)}
              </div>
            )}

            <div>
              <label className="form-label text-[11px] font-bold">Color de Fondo</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.backgroundColor || '#ffffff'}
                  onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[var(--color-border)] cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.backgroundColor || '#ffffff'}
                  onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                  className="input-field text-xs font-mono flex-1"
                />
              </div>
            </div>

            <div>
              <label className="form-label text-[11px] font-bold">Color de Texto</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.textColor || '#111827'}
                  onChange={(e) => handleSettingChange('textColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[var(--color-border)] cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.textColor || '#111827'}
                  onChange={(e) => handleSettingChange('textColor', e.target.value)}
                  className="input-field text-xs font-mono flex-1"
                />
              </div>
            </div>

            <div>
              <label className="form-label text-[11px] font-bold">Color de Acento / Botones</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.accentColor || '#ec4899'}
                  onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[var(--color-border)] cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.accentColor || '#ec4899'}
                  onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                  className="input-field text-xs font-mono flex-1"
                />
              </div>
            </div>

            <div>
              <label className="form-label text-[11px] font-bold">Espaciado Vertical (Padding Y)</label>
              <input
                type="range"
                min={32}
                max={140}
                step={8}
                value={settings.paddingY || 72}
                onChange={(e) => handleSettingChange('paddingY', Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
              <div className="text-[10px] text-[var(--color-text-tertiary)] text-right font-mono">{settings.paddingY || 72}px</div>
            </div>

            {settings.enabled !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)]">
                <label className="form-label text-[11px] font-bold">Activar bloque</label>
                <input
                  type="checkbox"
                  checked={!!settings.enabled}
                  onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                  className="accent-[var(--color-accent)]"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Move block controls */}
      {onMove && (
        <div className="px-4 py-2 border-t border-[var(--color-border)] shrink-0 flex items-center justify-between" style={{ background: 'var(--color-bg-base)' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Orden en la ventana</span>
          <div className="flex items-center gap-1">
            <button onClick={() => onMove(-1)} className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]" title="Mover arriba"><ArrowUp size={13} /></button>
            <button onClick={() => onMove(1)} className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]" title="Mover abajo"><ArrowDown size={13} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
