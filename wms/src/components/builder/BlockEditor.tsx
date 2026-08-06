'use client'

import { Block, BlockConfig } from '@repo/blocks'
import { X, Copy, Trash2, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react'
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
  const [expandedGroup, setExpandedGroup] = useState<string | null>('settings')
  const [generating, setGenerating] = useState(false)

  if (!blockConfig) {
    return (
      <div className="w-80 border-l border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 flex items-center justify-center">
        <p className="text-sm text-[var(--color-text-tertiary)]">Select a block to edit</p>
      </div>
    )
  }

  const handleSettingChange = (key: string, value: any) => {
    onChange({ ...block.settings, [key]: value }, block.content)
  }

  const handleContentChange = (key: string, value: any) => {
    onChange(block.settings, { ...block.content, [key]: value })
  }

  const groupedFields = blockConfig.settingsSchema.reduce<Record<string, typeof blockConfig.settingsSchema>>((acc, field) => {
    const group = field.group || 'settings'
    if (!acc[group]) acc[group] = []
    acc[group].push(field)
    return acc
  }, {})

  const renderField = (field: any) => {
    const value = field.group === 'content' ? block.content[field.key] : block.settings[field.key]

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => field.group === 'content' ? handleContentChange(field.key, e.target.value) : handleSettingChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="input-field"
          />
        )
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => field.group === 'content' ? handleContentChange(field.key, e.target.value) : handleSettingChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="textarea-field"
          />
        )
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleSettingChange(field.key, Number(e.target.value))}
            min={field.min}
            max={field.max}
            step={field.step}
            className="input-field"
          />
        )
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleSettingChange(field.key, e.target.value)}
              className="w-8 h-8 rounded border border-[var(--color-border)] cursor-pointer"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleSettingChange(field.key, e.target.value)}
              className="input-field flex-1 font-mono text-xs"
            />
          </div>
        )
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleSettingChange(field.key, e.target.value)}
            className="select-field"
          >
            {field.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )
      case 'toggle':
        return (
          <button
            onClick={() => handleSettingChange(field.key, !value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-strong)]'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        )
      case 'slider':
        return (
          <div className="space-y-1">
            <input
              type="range"
              value={value || 0}
              onChange={(e) => handleSettingChange(field.key, Number(e.target.value))}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              className="w-full accent-[var(--color-accent)]"
            />
            <div className="text-xs text-[var(--color-text-tertiary)] text-right">{value}%</div>
          </div>
        )
      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => field.group === 'content' ? handleContentChange(field.key, e.target.value) : handleSettingChange(field.key, e.target.value)}
              placeholder="Image URL"
              className="input-field"
            />
            {value && (
              <img src={value} alt="Preview" className="w-full h-24 object-cover rounded-lg border border-[var(--color-border)]" />
            )}
          </div>
        )
      case 'link':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => field.group === 'content' ? handleContentChange(field.key, e.target.value) : handleSettingChange(field.key, e.target.value)}
            placeholder="/page or https://..."
            className="input-field"
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="w-80 border-l border-[var(--color-border)] bg-[var(--color-bg-surface)] flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{blockConfig.name}</h3>
          <p className="text-xs text-[var(--color-text-tertiary)]">{blockConfig.description}</p>
        </div>
        <div className="flex items-center gap-1">
          {onGenerateAI && (
            <button
              onClick={async () => {
                setGenerating(true)
                try { await onGenerateAI(block.type) } finally { setGenerating(false) }
              }}
              disabled={generating}
              className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-muted)] rounded-lg transition-colors disabled:opacity-50"
              title="Generar con IA"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
          )}
          <button onClick={onDuplicate}
            className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-info)] hover:bg-[var(--color-info-muted)] rounded-lg transition-colors"
            title="Duplicate">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={onDelete}
            className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-muted)] rounded-lg transition-colors"
            title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedFields).map(([group, fields]) => (
          <div key={group} className="border-b border-[var(--color-border)]">
            <button
              onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <span className="capitalize">{group === 'settings' ? 'Settings' : group}</span>
              {expandedGroup === group ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedGroup === group && (
              <div className="px-4 pb-4 space-y-3">
                {fields.map(field => (
                  <div key={field.key}>
                    <label className="form-label">{field.label}</label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
