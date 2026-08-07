'use client'

import { Block, BlockConfig } from '@repo/blocks'
import { X, Copy, Trash2, ChevronDown, ChevronUp, Sparkles, Loader2, Plus, Sliders, Type, Palette } from 'lucide-react'
import { useState } from 'react'

interface BlockEditorProps {
  block: Block
  blockConfig: BlockConfig | undefined
  onChange: (settings: Record<string, any>, content: Record<string, any>) => void
  onDuplicate: () => void
  onDelete: () => void
  onGenerateAI?: (blockType: string) => Promise<void>
}

export default function BlockEditor({ block, blockConfig, onChange, onDuplicate, onDelete, onGenerateAI }: BlockEditorProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'style'>('content')
  const [generating, setGenerating] = useState(false)

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

  const handleSettingChange = (key: string, value: any) => {
    onChange({ ...settings, [key]: value }, content)
  }

  const handleContentChange = (key: string, value: any) => {
    onChange(settings, { ...content, [key]: value })
  }

  const updateItemInList = (listKey: string, index: number, itemField: string, itemValue: any) => {
    const list = Array.isArray(content[listKey]) ? [...content[listKey]] : []
    if (list[index]) {
      list[index] = { ...list[index], [itemField]: itemValue }
      handleContentChange(listKey, list)
    }
  }

  const addItemToList = (listKey: string, defaultItem: any) => {
    const list = Array.isArray(content[listKey]) ? [...content[listKey]] : []
    list.push(defaultItem)
    handleContentChange(listKey, list)
  }

  const removeItemFromList = (listKey: string, index: number) => {
    const list = Array.isArray(content[listKey]) ? [...content[listKey]] : []
    list.splice(index, 1)
    handleContentChange(listKey, list)
  }

  return (
    <div className="w-80 xl:w-88 border-l border-[var(--color-border)] bg-[var(--color-bg-surface)] flex flex-col h-full overflow-hidden text-xs">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between shrink-0" style={{ background: 'var(--color-bg-base)' }}>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs capitalize text-[var(--color-text-primary)]">{block.type.replace('-', ' ')}</span>
          </div>
          <p className="text-[10px] text-[var(--color-text-tertiary)]">ID: {block.id.slice(0, 8)}</p>
        </div>

        <div className="flex items-center gap-1">
          {onGenerateAI && (
            <button
              onClick={async () => {
                setGenerating(true)
                try { await onGenerateAI(block.type) } finally { setGenerating(false) }
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
          <Palette size={13} /> Estilos & Fondo
        </button>
      </div>

      {/* Content Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* Title */}
            {content.title !== undefined && (
              <div>
                <label className="form-label text-[11px] font-bold">Título Principal</label>
                <input
                  type="text"
                  value={content.title || ''}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  className="input-field text-xs font-semibold"
                  placeholder="Título del bloque..."
                />
              </div>
            )}

            {/* Subtitle / Body */}
            {content.subtitle !== undefined && (
              <div>
                <label className="form-label text-[11px] font-bold">Subtítulo / Bajada</label>
                <textarea
                  value={content.subtitle || ''}
                  onChange={(e) => handleContentChange('subtitle', e.target.value)}
                  rows={2}
                  className="textarea-field text-xs"
                  placeholder="Descripción secundaria..."
                />
              </div>
            )}

            {content.body !== undefined && (
              <div>
                <label className="form-label text-[11px] font-bold">Cuerpo de Texto</label>
                <textarea
                  value={content.body || ''}
                  onChange={(e) => handleContentChange('body', e.target.value)}
                  rows={4}
                  className="textarea-field text-xs"
                  placeholder="Contenido largo..."
                />
              </div>
            )}

            {/* Primary & Secondary Buttons */}
            {content.buttonText !== undefined && (
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="form-label text-[11px] font-bold">Texto Botón Principal</label>
                  <input
                    type="text"
                    value={content.buttonText || ''}
                    onChange={(e) => handleContentChange('buttonText', e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
                {content.secondaryButtonText !== undefined && (
                  <div>
                    <label className="form-label text-[11px] font-bold">Texto Botón Secundario</label>
                    <input
                      type="text"
                      value={content.secondaryButtonText || ''}
                      onChange={(e) => handleContentChange('secondaryButtonText', e.target.value)}
                      className="input-field text-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Products Array Editor */}
            {Array.isArray(content.products) && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="form-label text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-accent)]">
                    Lista de Productos ({content.products.length})
                  </label>
                  <button
                    onClick={() => addItemToList('products', { name: 'Nuevo Producto', price: 'S/ 50.00', emoji: '🛍️' })}
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all"
                  >
                    <Plus size={11} /> Añadir
                  </button>
                </div>
                <div className="space-y-2">
                  {content.products.map((item: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] space-y-2 relative group">
                      <button
                        onClick={() => removeItemFromList('products', idx)}
                        className="absolute right-2 top-2 text-[var(--color-error)] hover:opacity-80 p-1"
                        title="Quitar producto"
                      >
                        <Trash2 size={12} />
                      </button>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.emoji || '🛍️'}
                          onChange={(e) => updateItemInList('products', idx, 'emoji', e.target.value)}
                          className="w-8 text-center input-field text-xs"
                        />
                        <input
                          type="text"
                          value={item.name || ''}
                          onChange={(e) => updateItemInList('products', idx, 'name', e.target.value)}
                          className="input-field text-xs font-semibold flex-1"
                          placeholder="Nombre del producto"
                        />
                      </div>
                      <input
                        type="text"
                        value={item.price || ''}
                        onChange={(e) => updateItemInList('products', idx, 'price', e.target.value)}
                        className="input-field text-xs font-mono"
                        placeholder="Precio (Ej: S/ 89.90)"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features Array Editor */}
            {Array.isArray(content.items) && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="form-label text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-accent)]">
                    Ítems ({content.items.length})
                  </label>
                  <button
                    onClick={() => addItemToList('items', { icon: '✨', title: 'Nuevo Ítem', description: 'Descripción breve' })}
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all"
                  >
                    <Plus size={11} /> Añadir
                  </button>
                </div>
                <div className="space-y-2">
                  {content.items.map((item: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] space-y-2 relative">
                      <button
                        onClick={() => removeItemFromList('items', idx)}
                        className="absolute right-2 top-2 text-[var(--color-error)] hover:opacity-80 p-1"
                      >
                        <Trash2 size={12} />
                      </button>
                      {typeof item === 'object' ? (
                        <>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.icon || item.name || '✦'}
                              onChange={(e) => updateItemInList('items', idx, item.icon ? 'icon' : 'name', e.target.value)}
                              className="w-8 text-center input-field text-xs"
                            />
                            <input
                              type="text"
                              value={item.title || item.name || ''}
                              onChange={(e) => updateItemInList('items', idx, item.title ? 'title' : 'name', e.target.value)}
                              className="input-field text-xs font-semibold flex-1"
                              placeholder="Título"
                            />
                          </div>
                          {item.description && (
                            <textarea
                              value={item.description || ''}
                              onChange={(e) => updateItemInList('items', idx, 'description', e.target.value)}
                              rows={2}
                              className="textarea-field text-xs"
                              placeholder="Descripción"
                            />
                          )}
                        </>
                      ) : (
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const list = [...content.items]
                            list[idx] = e.target.value
                            handleContentChange('items', list)
                          }}
                          className="input-field text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'style' && (
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
          </div>
        )}
      </div>
    </div>
  )
}
