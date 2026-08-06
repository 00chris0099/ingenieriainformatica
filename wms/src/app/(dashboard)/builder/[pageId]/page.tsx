'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Block, blockRegistry } from '@repo/blocks'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import BlockPalette from '@/components/builder/BlockPalette'
import CanvasPreview from '@/components/builder/CanvasPreview'
import BlockEditor from '@/components/builder/BlockEditor'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Save, Eye, ArrowLeft, Loader2, Monitor, Tablet, Smartphone, Undo2, Redo2, Sparkles } from 'lucide-react'

interface PageData {
  id: string
  title: string
  slug: string
  description?: string
  type: string
  status: string
  blocks: Block[]
  seo: any
  settings: any
}

export default function BuilderPage() {
  const params = useParams()
  const router = useRouter()
  const pageId = params.pageId as string

  const [page, setPage] = useState<PageData | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [history, setHistory] = useState<Block[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => { fetchPage() }, [pageId])

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/v1/pages/${pageId}`)
      if (res.ok) {
        const data = await res.json()
        const pageData = data.data
        setPage(pageData)
        const loadedBlocks: Block[] = Array.isArray(pageData.blocks) ? (pageData.blocks as Block[]) : []
        setBlocks(loadedBlocks)
        setHistory([loadedBlocks])
        setHistoryIndex(0)
      }
    } catch (error) { console.error('Error fetching page:', error) }
    finally { setLoading(false) }
  }

  const pushHistory = useCallback((newBlocks: Block[]) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newBlocks])
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  const undo = () => {
    if (historyIndex > 0) {
      const prev = historyIndex - 1
      setHistoryIndex(prev)
      setBlocks(history[prev] || [])
      setSelectedBlockId(null)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = historyIndex + 1
      setHistoryIndex(next)
      setBlocks(history[next] || [])
      setSelectedBlockId(null)
    }
  }

  const addBlock = (type: string) => {
    const config = blockRegistry.get(type)
    if (!config) return
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      settings: { ...config.defaultSettings },
      content: { ...config.defaultContent },
    }
    const newBlocks = [...blocks, newBlock]
    setBlocks(newBlocks)
    pushHistory(newBlocks)
    setSelectedBlockId(newBlock.id)
  }

  const updateBlock = (id: string, settings: Record<string, any>, content: Record<string, any>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, settings, content } : b))
  }

  const commitBlockUpdate = () => { pushHistory(blocks) }

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex(b => b.id === id)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === blocks.length - 1) return
    const newBlocks = [...blocks]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const temp = newBlocks[swapIdx]!
    newBlocks[swapIdx] = newBlocks[idx]!
    newBlocks[idx] = temp
    setBlocks(newBlocks)
    pushHistory(newBlocks)
  }

  const duplicateBlock = (id: string) => {
    const block = blocks.find(b => b.id === id)
    if (!block) return
    const newBlock: Block = { ...block, id: crypto.randomUUID(), settings: { ...block.settings }, content: { ...block.content } }
    const idx = blocks.findIndex(b => b.id === id)
    const newBlocks = [...blocks]
    newBlocks.splice(idx + 1, 0, newBlock)
    setBlocks(newBlocks)
    pushHistory(newBlocks)
    setSelectedBlockId(newBlock.id)
  }

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id)
    setBlocks(newBlocks)
    pushHistory(newBlocks)
    if (selectedBlockId === id) setSelectedBlockId(null)
  }

  const generateBlockAI = async (blockType: string) => {
    try {
      const res = await fetch('/api/v1/ai/generate-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockType, businessName: page?.title || 'Mi negocio',
          businessDescription: page?.description || '', language: 'es', tone: 'professional',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const aiContent = data.data?.content
        if (aiContent && selectedBlockId) {
          const block = blocks.find(b => b.id === selectedBlockId)
          if (block) {
            updateBlock(selectedBlockId, block.settings, { ...block.content, ...aiContent })
            pushHistory(blocks.map(b => b.id === selectedBlockId ? { ...b, content: { ...b.content, ...aiContent } } : b))
          }
        }
      }
    } catch (error) { console.error('Error generating AI content:', error) }
  }

  const handleDragStart = (event: DragStartEvent) => { setActiveDragId(event.active.id as string) }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragId(null)
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return
    if (active.data.current?.fromPalette) { addBlock(active.data.current.type); return }
    const oldIndex = blocks.findIndex(b => b.id === activeId)
    const newIndex = blocks.findIndex(b => b.id === overId)
    if (oldIndex !== -1 && newIndex !== -1) {
      const newBlocks = arrayMove(blocks, oldIndex, newIndex)
      setBlocks(newBlocks)
      pushHistory(newBlocks)
    }
  }

  const generatePageAI = async () => {
    try {
      const res = await fetch('/api/v1/ai/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: page?.title || 'Mi negocio',
          businessDescription: page?.description || 'Sitio web profesional',
          industry: 'services', pageType: page?.type || 'landing',
          language: 'es', tone: 'professional',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const aiBlocks = data.data?.blocks
        if (aiBlocks && Array.isArray(aiBlocks) && aiBlocks.length > 0) {
          setBlocks(aiBlocks)
          pushHistory(aiBlocks)
          setSelectedBlockId(null)
        }
      }
    } catch (error) { console.error('Error generating AI page:', error) }
  }

  const savePage = async (status?: string) => {
    setSaving(true)
    try {
      const body: any = { blocks }
      if (status) body.status = status
      const res = await fetch(`/api/v1/pages/${pageId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        setPage(data.data)
      }
    } catch (error) { console.error('Error saving page:', error) }
    finally { setSaving(false) }
  }

  const selectedBlock = blocks.find(b => b.id === selectedBlockId)
  const selectedBlockConfig = selectedBlock ? blockRegistry.get(selectedBlock.type) : undefined

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-[var(--color-text-tertiary)]">
        <p className="text-lg font-medium mb-2">Page not found</p>
        <Button variant="link" onClick={() => router.push('/pages')}>Back to Pages</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-4 md:-m-6">
      {/* Top Bar */}
      <div className="h-12 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/pages')}
            className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{page.title}</h2>
            <p className="text-xs text-[var(--color-text-tertiary)]">/{page.slug}</p>
          </div>
          <Badge variant={page.status === 'published' ? 'success' : 'warning'}>{page.status}</Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden mr-2">
            <button onClick={undo} disabled={historyIndex === 0}
              className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Undo">
              <Undo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-[var(--color-border)]" />
            <button onClick={redo} disabled={historyIndex === history.length - 1}
              className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Redo">
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Generate with AI */}
          <Button variant="secondary" size="sm" icon={<Sparkles size={14} />} onClick={generatePageAI} className="mr-2">
            Generar con IA
          </Button>

          {/* Preview Mode */}
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden mr-2">
            <button onClick={() => setPreviewMode('desktop')}
              className={`p-1.5 transition-colors ${previewMode === 'desktop' ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'}`}
              title="Desktop">
              <Monitor className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-[var(--color-border)]" />
            <button onClick={() => setPreviewMode('tablet')}
              className={`p-1.5 transition-colors ${previewMode === 'tablet' ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'}`}
              title="Tablet">
              <Tablet className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-[var(--color-border)]" />
            <button onClick={() => setPreviewMode('mobile')}
              className={`p-1.5 transition-colors ${previewMode === 'mobile' ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'}`}
              title="Mobile">
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <Button variant="secondary" size="sm" icon={<Save size={14} />} loading={saving} onClick={() => savePage()}>
            Save
          </Button>
          <Button size="sm" icon={<Eye size={14} />} loading={saving} onClick={() => savePage('published')}>
            Publish
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex overflow-hidden">
          <BlockPalette onAddBlock={addBlock} />

          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <CanvasPreview
              blocks={blocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onMoveBlock={moveBlock}
              onDuplicateBlock={duplicateBlock}
              onDeleteBlock={deleteBlock}
              previewMode={previewMode}
            />
          </SortableContext>

          {selectedBlock && selectedBlockConfig && (
            <BlockEditor
              block={selectedBlock}
              blockConfig={selectedBlockConfig}
              onChange={(settings, content) => updateBlock(selectedBlock.id, settings, content)}
              onDuplicate={() => duplicateBlock(selectedBlock.id)}
              onDelete={() => deleteBlock(selectedBlock.id)}
              onGenerateAI={generateBlockAI}
            />
          )}
        </div>
      </DndContext>
    </div>
  )
}
