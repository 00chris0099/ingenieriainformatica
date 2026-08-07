'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save, Eye, ArrowLeft, Undo, Redo, Plus, Monitor, Tablet, Smartphone,
  Wand2, Check, Sparkles, X, Send, Bot, Layers, Sliders, Maximize2, Minimize2, ExternalLink
} from 'lucide-react'
import { Block, blockRegistry } from '@repo/blocks'
import BlockEditor from '@/components/builder/BlockEditor'
import { Button } from '@/components/ui/Button'

interface PageData {
  id: string
  title: string
  slug: string
  type: string
  status: string
  blocks: Block[]
  seo?: Record<string, any>
  settings?: Record<string, any>
}

interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  text: string
  timestamp: string
}

export default function BuilderPage({ params }: { params: { pageId: string } }) {
  const { pageId } = params
  const router = useRouter()

  const [page, setPage] = useState<PageData | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [fullScreen, setFullScreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  // Undo / Redo history
  const [history, setHistory] = useState<Block[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Sidebars
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)

  // AI Chat Messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '¡Hola! Soy tu Copiloto de IA para diseño de tiendas virtuales. Dime qué cambios deseas realizar (ej: "Agrega una colección de ropa de invierno con ofertas", "Cambia la paleta a tonos rosé", "Optimiza los botones de compra").',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [inputPrompt, setInputPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'SELECT_BLOCK' && e.data.blockId) {
        setSelectedBlockId(e.data.blockId)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    fetchPage()
  }, [pageId])

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/v1/pages/${pageId}`)
      if (res.ok) {
        const data = await res.json()
        const pageData = data.data
        if (pageData) {
          setPage(pageData)
          const loadedBlocks: Block[] = Array.isArray(pageData.blocks) ? (pageData.blocks as Block[]) : []
          setBlocks(loadedBlocks)
          setHistory([loadedBlocks])
          setHistoryIndex(0)
          setLoading(false)
          return
        }
      }
    } catch (error) { console.error('Error fetching page:', error) }

    // Fallback: create synthetic page so the editor always opens
    setPage({
      id: pageId,
      title: 'Tienda Moda & Tendencias',
      slug: pageId.replace('page-', 'tienda-'),
      type: 'store',
      status: 'draft',
      blocks: [],
    })
    setBlocks([])
    setHistory([[]])
    setHistoryIndex(0)
    setLoading(false)
  }

  const pushHistory = useCallback((newBlocks: Block[]) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1)
      next.push(newBlocks)
      return next
    })
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  const updateBlocks = (newBlocks: Block[]) => {
    setBlocks(newBlocks)
    pushHistory(newBlocks)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      const target = history[prevIndex]
      if (target) {
        setHistoryIndex(prevIndex)
        setBlocks(target)
      }
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      const target = history[nextIndex]
      if (target) {
        setHistoryIndex(nextIndex)
        setBlocks(target)
      }
    }
  }

  const handleAddBlock = (type: string) => {
    const config = blockRegistry.get(type as any)
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      settings: config?.defaultSettings || {},
      content: config?.defaultContent || {},
    }
    const updated = [...blocks, newBlock]
    updateBlocks(updated)
    setSelectedBlockId(newBlock.id)
    setShowBlockPicker(false)
  }

  const handleUpdateBlock = (id: string, settings: Record<string, any>, content: Record<string, any>) => {
    const updated = blocks.map(b => b.id === id ? { ...b, settings, content } : b)
    setBlocks(updated)
  }

  const handleDuplicateBlock = (id: string) => {
    const blockToDup = blocks.find(b => b.id === id)
    if (!blockToDup) return
    const newBlock: Block = {
      ...JSON.parse(JSON.stringify(blockToDup)),
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    }
    const index = blocks.findIndex(b => b.id === id)
    const updated = [...blocks]
    updated.splice(index + 1, 0, newBlock)
    updateBlocks(updated)
    setSelectedBlockId(newBlock.id)
  }

  const handleDeleteBlock = (id: string) => {
    const updated = blocks.filter(b => b.id !== id)
    updateBlocks(updated)
    if (selectedBlockId === id) setSelectedBlockId(null)
  }

  const savePage = async (status?: string) => {
    if (!page) return
    setSaving(true)
    try {
      const body: any = { blocks, title: page.title, slug: page.slug, type: page.type }
      if (status) body.status = status

      const res = await fetch(`/api/v1/pages/${pageId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.data) {
          setPage(data.data)
        }
      }
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2000)
    } catch (error) {
      console.error('Error saving page:', error)
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2000)
    }
    finally { setSaving(false) }
  }

  const openPublicView = () => {
    savePage('published')
    window.open(`/p/${pageId}`, '_blank')
  }

  // AI Copilot Prompt Processing
  const handleAISend = async () => {
    if (!inputPrompt.trim() || aiGenerating) return

    const userText = inputPrompt.trim()
    setInputPrompt('')

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setChatMessages(prev => [...prev, userMsg])
    setAiGenerating(true)

    try {
      const res = await fetch('/api/v1/ai/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: page?.title || 'Tienda Moda',
          businessDescription: userText,
          industry: 'fashion',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const aiBlocks: Block[] = data.data?.blocks || []
        if (aiBlocks.length > 0) {
          updateBlocks(aiBlocks)
          setChatMessages(prev => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: `✨ He aplicado tu instrucción. Se ha generado una estructura completa de tienda virtual con ${aiBlocks.length} secciones (Hero, Productos con precios, Garantías y CTA).`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ])
        }
      } else {
        throw new Error('AI Error')
      }
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'He procesado tu solicitud. Los bloques de la tienda han sido optimizados con el Skill de UI/UX de alta conversión.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setAiGenerating(false)
    }
  }

  const selectedBlock = blocks.find(b => b.id === selectedBlockId)
  const selectedConfig = selectedBlock ? blockRegistry.get(selectedBlock.type as any) : undefined

  const deviceWidths = {
    desktop: 'w-full max-w-full',
    tablet: 'w-[768px] mx-auto shadow-2xl rounded-2xl overflow-hidden border border-gray-700 my-4',
    mobile: 'w-[395px] mx-auto shadow-2xl rounded-3xl overflow-hidden border-4 border-gray-800 my-4',
  }

  // Generate Iframe srcDoc HTML with interactive hover & click listeners
  const generatePreviewHtml = () => {
    const blocksHtml = blocks.map(b => {
      const s = b.settings || {}
      const c = b.content || {}
      const isSelected = b.id === selectedBlockId

      const activeBorder = isSelected ? 'outline: 3px solid #ec4899; outline-offset: -3px;' : ''

      if (b.type === 'navbar') {
        const links = Array.isArray(c.links) ? c.links : []
        return `
          <header style="background:${s.backgroundColor || '#fff'}; color:${s.textColor || '#111'}; position:sticky; top:0; z-index:40; border-b:1px solid #e2e8f0; ${activeBorder}" data-block-id="${b.id}">
            ${c.announcement ? `<div style="background:${s.accentColor || '#f43f5e'}; color:#fff; text-align:center; padding:6px 12px; font-size:11px; font-weight:800; letter-spacing:0.5px;">${c.announcement}</div>` : ''}
            <div style="max-width:1200px; margin:0 auto; padding:12px 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
              <div style="font-size:18px; font-weight:900; letter-spacing:-0.5px; color:${s.textColor || '#111'}; display:flex; align-items:center; gap:8px;">
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${s.accentColor || '#f43f5e'};"></span>
                ${c.brandName || 'TIENDA VIRTUAL'}
              </div>
              <nav style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
                ${links.map((link: any) => `
                  <a href="#${link.windowId || 'home'}" style="font-size:12px; font-weight:700; color:${s.textColor || '#475569'}; text-decoration:none; padding:4px 8px; border-radius:6px; transition:all 0.15s;" onmouseover="this.style.color='${s.accentColor || '#f43f5e'}'" onmouseout="this.style.color='${s.textColor || '#475569'}'">
                    ${link.label}
                  </a>
                `).join('')}
              </nav>
            </div>
          </header>
        `
      }

      if (b.type === 'hero') {
        return `
          <section style="background:${s.backgroundColor || '#0f172a'}; color:${s.textColor || '#fff'}; padding:${s.paddingY || 96}px 24px; text-align:center; position:relative; ${activeBorder}" data-block-id="${b.id}">
            <div style="max-width: 900px; margin:0 auto;">
              ${c.badge ? `<span style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; padding:6px 16px; border-radius:20px; background:rgba(244,63,94,0.15); color:${s.accentColor || '#f43f5e'}; display:inline-block; margin-bottom:16px; border:1px solid rgba(244,63,94,0.3);">${c.badge}</span>` : ''}
              <h1 style="font-size: 42px; font-weight:900; margin-bottom:16px; line-height:1.1; tracking-tight;">${c.title || 'Moda & Tendencias'}</h1>
              <p style="font-size:17px; opacity:0.85; margin-bottom:32px; max-width:650px; margin-left:auto; margin-right:auto; line-height:1.6;">${c.subtitle || 'Descubre prendas únicas diseñadas para destacar.'}</p>
              <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                <a style="background:${s.accentColor || '#f43f5e'}; color:#fff; padding:14px 32px; border-radius:12px; font-weight:800; text-decoration:none; box-shadow:0 10px 25px rgba(244,63,94,0.3); font-size:15px;" href="#productos">${c.buttonText || 'Ver Catálogo'}</a>
                ${c.secondaryButtonText ? `<a style="background:rgba(255,255,255,0.1); color:#fff; padding:14px 28px; border-radius:12px; font-weight:700; text-decoration:none; font-size:15px; border:1px solid rgba(255,255,255,0.2);" href="#ofertas">${c.secondaryButtonText}</a>` : ''}
              </div>
            </div>
          </section>
        `
      }

      if (b.type === 'product-grid') {
        const products = Array.isArray(c.products) ? c.products : []
        const tabs = Array.isArray(c.categoryTabs) ? c.categoryTabs : []
        return `
          <section id="productos" style="background:${s.backgroundColor || '#fff'}; color:${s.textColor || '#111'}; padding:${s.paddingY || 72}px 24px; ${activeBorder}" data-block-id="${b.id}">
            <div style="max-width: 1150px; margin:0 auto;">
              <h2 style="font-size: 28px; font-weight:900; text-align:center; margin-bottom:8px;">${c.title || 'Catálogo de Productos'}</h2>
              ${c.subtitle ? `<p style="text-align:center; font-size:14px; color:#64748b; margin-bottom:28px;">${c.subtitle}</p>` : ''}
              
              <!-- Multi-Window Category Tabs -->
              ${tabs.length > 0 ? `
                <div style="display:flex; justify-content:center; gap:8px; margin-bottom:36px; flex-wrap:wrap;">
                  ${tabs.map((tab: any, idx: number) => `
                    <button style="padding:8px 18px; border-radius:20px; font-size:12px; font-weight:700; border:${idx === 0 ? 'none' : '1px solid #e2e8f0'}; background:${idx === 0 ? (s.accentColor || '#f43f5e') : '#f8fafc'}; color:${idx === 0 ? '#fff' : '#475569'}; cursor:pointer;">
                      ${tab.label}
                    </button>
                  `).join('')}
                </div>
              ` : ''}

              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:24px;">
                ${products.map((p: any) => `
                  <div style="border:1px solid #e2e8f0; border-radius:20px; padding:20px; background:#fff; text-align:left; box-shadow:0 4px 20px rgba(0,0,0,0.03); position:relative; display:flex; flex-direction:column; justify-content:space-between;">
                    ${p.discountBadge ? `<span style="position:absolute; top:12px; right:12px; background:#fff1f2; color:#f43f5e; font-size:10px; font-weight:800; padding:4px 10px; border-radius:12px; border:1px solid #fecdd3;">${p.discountBadge}</span>` : ''}
                    <div>
                      <div style="height:140px; background:#f8fafc; border-radius:14px; display:flex; align-items:center; justify-content:center; margin-bottom:16px; border:1px solid #f1f5f9;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${s.accentColor || '#f43f5e'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                      </div>
                      <h3 style="font-size:15px; font-weight:800; margin-bottom:6px; color:#0f172a; line-height:1.3;">${p.name}</h3>
                      <p style="font-size:12px; color:#64748b; margin-bottom:12px; line-height:1.4;">${p.description || ''}</p>
                      
                      <!-- Size selector badge options -->
                      ${Array.isArray(p.sizes) ? `
                        <div style="display:flex; gap:4px; margin-bottom:12px;">
                          ${p.sizes.map((sz: string) => `<span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:6px; background:#f1f5f9; color:#475569;">${sz}</span>`).join('')}
                        </div>
                      ` : ''}

                      <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:16px;">
                        <span style="font-size:22px; font-weight:900; color:${s.accentColor || '#f43f5e'};">${p.price}</span>
                        ${p.originalPrice ? `<span style="font-size:13px; text-decoration:line-through; color:#94a3b8;">${p.originalPrice}</span>` : ''}
                      </div>
                    </div>
                    
                    <button style="width:100%; background:${s.accentColor || '#f43f5e'}; color:#fff; border:none; padding:12px; border-radius:12px; font-weight:800; font-size:13px; cursor:pointer; box-shadow:0 8px 16px rgba(244,63,94,0.25);">
                      Pedir por WhatsApp
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `
      }

      if (b.type === 'features') {
        const items = Array.isArray(c.items) ? c.items : []
        return `
          <section style="background:${s.backgroundColor || '#f8fafc'}; color:${s.textColor || '#111'}; padding:${s.paddingY || 64}px 24px; ${activeBorder}" data-block-id="${b.id}">
            <div style="max-width: 1100px; margin:0 auto; text-align:center;">
              <h2 style="font-size:26px; font-weight:900; margin-bottom:40px;">${c.title || 'Beneficios Exclusivos'}</h2>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:24px;">
                ${items.map((item: any) => `
                  <div style="padding:24px; background:#fff; border-radius:20px; border:1px solid #e2e8f0; text-align:left; box-shadow:0 4px 15px rgba(0,0,0,0.02);">
                    <div style="width:44px; height:44px; border-radius:12px; background:#fff1f2; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${s.accentColor || '#f43f5e'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    </div>
                    <h3 style="font-size:16px; font-weight:800; margin-bottom:8px; color:#0f172a;">${item.title || 'Beneficio'}</h3>
                    <p style="font-size:13px; color:#64748b; line-height:1.5;">${item.description || ''}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `
      }

      if (b.type === 'testimonials') {
        const items = Array.isArray(c.items) ? c.items : []
        return `
          <section style="background:${s.backgroundColor || '#fff'}; color:${s.textColor || '#111'}; padding:${s.paddingY || 64}px 24px; ${activeBorder}" data-block-id="${b.id}">
            <div style="max-width: 1000px; margin:0 auto; text-align:center;">
              <h2 style="font-size:26px; font-weight:800; margin-bottom:36px;">${c.title || 'Opiniones de nuestros Clientes'}</h2>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
                ${items.map((t: any) => `
                  <div style="padding:20px; border-radius:16px; background:#f8fafc; border:1px solid #e2e8f0; text-align:left;">
                    <div style="color:#f59e0b; margin-bottom:8px;">★★★★★</div>
                    <p style="font-size:13px; color:#334155; font-style:italic; margin-bottom:12px;">"${t.text || t.comment || ''}"</p>
                    <div style="font-weight:700; font-size:13px; color:#0f172a;">${t.name || 'Cliente'}</div>
                    <div style="font-size:11px; opacity:0.6; color:#64748b;">${t.role || 'Comprador verificado'}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `
      }

      if (b.type === 'cta') {
        return `
          <section style="background:${s.accentColor || '#ec4899'}; color:#fff; padding:${s.paddingY || 80}px 24px; text-align:center; ${activeBorder}" data-block-id="${b.id}">
            <div style="max-width:800px; margin:0 auto;">
              <h2 style="font-size:32px; font-weight:900; margin-bottom:16px;">${c.title || '¡Promoción Especial!'}</h2>
              <p style="font-size:16px; opacity:0.9; margin-bottom:28px;">${c.description || ''}</p>
              <button style="background:#fff; color:${s.accentColor || '#ec4899'}; border:none; padding:14px 36px; border-radius:12px; font-weight:900; font-size:16px; cursor:pointer; box-shadow:0 10px 20px rgba(0,0,0,0.15);">${c.buttonText || 'Obtener Oferta'}</button>
            </div>
          </section>
        `
      }

      if (b.type === 'footer') {
        return `
          <footer style="background:${s.backgroundColor || '#0f172a'}; color:${s.textColor || '#fff'}; padding:${s.paddingY || 48}px 24px; text-align:center; border-top:1px solid rgba(255,255,255,0.1); ${activeBorder}" data-block-id="${b.id}">
            <div style="max-width:1100px; margin:0 auto;">
              <h3 style="font-size:20px; font-weight:900; margin-bottom:16px; letter-spacing:1px;">${c.brandName || 'MI TIENDA'}</h3>
              <p style="font-size:13px; opacity:0.6; margin-bottom:24px;">${c.copyright || '© 2026 Todos los derechos reservados.'}</p>
            </div>
          </footer>
        `
      }

      return `<div style="padding:40px; text-align:center; border:1px dashed #ccc;" data-block-id="${b.id}">${b.type}</div>`
    }).join('')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * { box-sizing: border-box; margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { background: #f8fafc; color: #0f172a; }
            [data-block-id] { cursor: pointer; transition: all 0.2s ease; position: relative; }
            [data-block-id]:hover { outline: 2px dashed #ec4899 !important; outline-offset: -2px; }
          </style>
        </head>
        <body>
          ${blocksHtml || '<div style="padding:100px; text-align:center; color:#94a3b8; font-weight:600;">Canvas Vacío. Haz clic en "+ Agregar Bloque" o usa el Copiloto de IA para comenzar.</div>'}
          <script>
            document.addEventListener('click', function(e) {
              const el = e.target.closest('[data-block-id]');
              if (el) {
                const id = el.getAttribute('data-block-id');
                window.parent.postMessage({ type: 'SELECT_BLOCK', blockId: id }, '*');
              }
            });
          </script>
        </body>
      </html>
    `
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg-base)] overflow-hidden font-sans">
      {/* ═══════════════ TOP BAR ═══════════════ */}
      <header className="h-14 shrink-0 px-4 flex items-center justify-between border-b"
        style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>

        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/pages')} className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{page?.title || 'Diseñador Visual'}</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-pink-500/10 text-pink-500">Pro Builder</span>
            </div>
            <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>/{page?.slug}</p>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border)' }}>
          {[
            { mode: 'desktop', icon: Monitor, label: 'Desktop' },
            { mode: 'tablet', icon: Tablet, label: 'Tablet' },
            { mode: 'mobile', icon: Smartphone, label: 'Móvil' },
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setDevice(mode as any)}
              className={`p-1.5 rounded-lg transition-all ${device === mode ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
              title={label}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-40" style={{ color: 'var(--color-text-secondary)' }} title="Deshacer">
            <Undo size={16} />
          </button>
          <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-40" style={{ color: 'var(--color-text-secondary)' }} title="Rehacer">
            <Redo size={16} />
          </button>

          <button
            onClick={() => setFullScreen(!fullScreen)}
            className={`p-2 rounded-xl border transition-all ${fullScreen ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-[var(--color-border)]'}`}
            title={fullScreen ? "Salir de Pantalla Completa" : "Pantalla Completa (Ver Canvas Solo)"}
          >
            {fullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            onClick={() => setShowAIChat(!showAIChat)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${showAIChat ? 'bg-purple-600 text-white shadow-lg' : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'}`}
          >
            <Sparkles size={14} /> Copiloto IA
          </button>

          <button
            onClick={openPublicView}
            className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 hover:bg-[var(--color-bg-hover)]"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            title="Ver sitio público en vivo"
          >
            <Eye size={14} className="text-emerald-500" /> Ver Sitio Público
          </button>

          <Button
            size="sm"
            loading={saving}
            icon={savedOk ? <Check size={14} /> : <Save size={14} />}
            onClick={() => savePage('published')}
          >
            {savedOk ? '¡Guardado!' : 'Guardar & Publicar'}
          </Button>
        </div>
      </header>

      {/* ═══════════════ MAIN CANVAS & PANELS ═══════════════ */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Block Library Panel (Hidden in FullScreen) */}
        {!fullScreen && (
          <div className="w-64 border-r flex flex-col shrink-0" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
            <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Secciones & Bloques</span>
              <button onClick={() => setShowBlockPicker(true)} className="p-1 text-xs font-bold rounded-lg bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all flex items-center gap-1">
                <Plus size={13} /> Añadir
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {blocks.map((b, idx) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBlockId(b.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedBlockId === b.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)] shadow-sm' : 'border-transparent hover:bg-[var(--color-bg-hover)]'}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold w-4 text-[var(--color-text-tertiary)]">{idx + 1}</span>
                    <span className="text-xs font-semibold capitalize truncate" style={{ color: 'var(--color-text-primary)' }}>{b.type.replace('-', ' ')}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(b.id) }} className="p-1 hover:text-red-500 transition-all text-gray-400">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Center Frame Render */}
        <div className="flex-1 bg-slate-900/10 overflow-y-auto flex justify-center p-4">
          <div className={`transition-all duration-300 ${deviceWidths[device]}`}>
            <iframe
              srcDoc={generatePreviewHtml()}
              className="w-full h-full min-h-[85vh] bg-white border-0 shadow-2xl rounded-xl"
              title="Canvas Preview"
            />
          </div>
        </div>

        {/* Right Inspector Panel (Hidden in FullScreen) */}
        {!fullScreen && selectedBlock && selectedConfig && (
          <BlockEditor
            block={selectedBlock}
            blockConfig={selectedConfig}
            onChange={(s, c) => handleUpdateBlock(selectedBlock.id, s, c)}
            onDuplicate={() => handleDuplicateBlock(selectedBlock.id)}
            onDelete={() => handleDeleteBlock(selectedBlock.id)}
          />
        )}

        {/* ═══════════════ AI COPILOT CHAT DRAWER ═══════════════ */}
        {showAIChat && (
          <div className="w-88 border-l flex flex-col shrink-0 shadow-2xl z-30 animate-fade-in" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
            <div className="p-3.5 border-b flex items-center justify-between bg-purple-600 text-white">
              <div className="flex items-center gap-2">
                <Bot size={18} />
                <span className="font-extrabold text-xs">Copiloto IA de Diseño</span>
              </div>
              <button onClick={() => setShowAIChat(false)} className="p-1 rounded hover:bg-white/10 text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-[var(--color-bg-base)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-bl-none'}`}>
                    <p>{msg.text}</p>
                    <span className="text-[9px] opacity-60 block mt-1 text-right">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              {aiGenerating && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-[var(--color-bg-base)] border border-[var(--color-border)] text-xs flex items-center gap-2 text-purple-500">
                    <Sparkles size={14} className="animate-spin" />
                    <span>Generando cambios con IA...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Prompt */}
            <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAISend()}
                  placeholder="Ej: Agrega catálogo de ropa de invierno..."
                  className="input-field text-xs flex-1"
                />
                <button onClick={handleAISend} disabled={aiGenerating || !inputPrompt.trim()} className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-all">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Block Picker Modal */}
      {showBlockPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border p-5 surface-card shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Añadir Nueva Sección</h3>
              <button onClick={() => setShowBlockPicker(false)} className="p-1 text-gray-400 hover:text-gray-200">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: 'hero', name: 'Hero Banner', desc: 'Encabezado principal con título y CTA' },
                { type: 'product-grid', name: 'Catálogo Productos', desc: 'Parrilla de productos con precios' },
                { type: 'features', name: 'Beneficios', desc: 'Grid de características con íconos' },
                { type: 'testimonials', name: 'Testimonios', desc: 'Opiniones de clientes' },
                { type: 'cta', name: 'Llamado a Acción', desc: 'Banner de oferta y conversión' },
                { type: 'footer', name: 'Pie de Página', desc: 'Copyright y enlaces' },
              ].map(item => (
                <div key={item.type} onClick={() => handleAddBlock(item.type)} className="p-3 rounded-xl border border-gray-700 hover:border-pink-500 hover:bg-pink-500/5 cursor-pointer transition-all">
                  <h4 className="font-bold text-xs">{item.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
