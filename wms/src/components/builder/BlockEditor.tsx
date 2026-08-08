'use client'

import { Block, BlockConfig } from '@repo/blocks'
import { X, Copy, Trash2, Loader2, Plus, Sliders, Type, Palette, Image as ImageIcon, ArrowUp, ArrowDown, Sparkles, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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

export default function BlockEditor({ block, blockConfig, windows, onChange, onWindowChange, onDuplicate, onDelete, onMove, onGenerateAI }: BlockEditorProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'style'>(() => loadEditorState(block.id)?.tab || 'content')
  const [collapsed, setCollapsed] = useState<string[]>(() => loadEditorState(block.id)?.collapsed || [])
  const [collapsedItems, setCollapsedItems] = useState<string[]>(() => loadEditorState(block.id)?.collapsedItems || [])
  const [generating, setGenerating] = useState(false)

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
          {field('URL del Logo (imagen)', textInput(content.logoUrl || '', (v) => handleContentChange('logoUrl', v), 'https://.../logo.png', true))}
          {content.logoUrl && (
            <img src={content.logoUrl} alt="Logo" className="h-12 w-auto rounded-lg border border-[var(--color-border)] object-contain bg-white p-1" />
          )}
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
          {field('Imagen de fondo / Hero', textInput(content.heroImage || '', (v) => handleContentChange('heroImage', v), 'https://.../hero.jpg', true))}
          {content.heroImage && (
            <img src={content.heroImage} alt="Hero" className="h-24 w-full rounded-xl border border-[var(--color-border)] object-cover" />
          )}
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
                {field('Imagen (URL)', textInput(item.imageUrl || '', (v) => updateItemInList('products', idx, 'imageUrl', v), 'https://.../foto.jpg', true))}
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-lg border border-[var(--color-border)] object-cover" />
                )}
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
                {field('Foto (URL)', textInput(m.photo || '', (v) => updateItemInList('items', idx, 'photo', v), 'https://...', true))}
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
