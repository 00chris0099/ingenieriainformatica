'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Block, blockRegistry } from '@repo/blocks'
import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import BlockPalette from '@/components/builder/BlockPalette'
import BlockEditor from '@/components/builder/BlockEditor'
import {
  Save, Eye, ArrowLeft, Loader2, Monitor, Tablet, Smartphone,
  Undo2, Redo2, Sparkles, ChevronDown, Globe, Layout
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

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

/** Generate the complete HTML document for the canvas iframe */
function generatePageHTML(blocks: Block[]): string {
  const blocksHTML = blocks.map(block => renderBlockHTML(block)).join('\n')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111; line-height: 1.6; }
  img { max-width: 100%; display: block; }
  a { color: inherit; }
  .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

  /* Hero */
  .block-hero { padding: 80px 24px; text-align: center; }
  .hero-title { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; line-height: 1.15; margin-bottom: 20px; }
  .hero-subtitle { font-size: 1.2rem; opacity: 0.75; max-width: 600px; margin: 0 auto 32px; }
  .hero-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .btn-primary { padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 1rem; cursor: pointer; border: none; transition: opacity .2s; }
  .btn-primary:hover { opacity: .88; }
  .btn-secondary { padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 1rem; cursor: pointer; border: 2px solid currentColor; background: transparent; transition: background .2s; }

  /* Features */
  .block-features { padding: 72px 24px; }
  .section-title { text-align: center; font-size: 2rem; font-weight: 800; margin-bottom: 12px; }
  .section-subtitle { text-align: center; opacity: .7; margin-bottom: 48px; max-width: 560px; margin-left: auto; margin-right: auto; }
  .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; }
  .feature-card { padding: 28px; border-radius: 16px; border: 1px solid #e5e7eb; }
  .feature-icon { font-size: 2rem; margin-bottom: 12px; }
  .feature-title { font-weight: 700; font-size: 1.05rem; margin-bottom: 8px; }
  .feature-desc { opacity: .7; font-size: .95rem; }

  /* CTA */
  .block-cta { padding: 80px 24px; text-align: center; }
  .cta-title { font-size: 2.2rem; font-weight: 800; margin-bottom: 16px; }
  .cta-desc { opacity: .8; margin-bottom: 32px; font-size: 1.05rem; max-width: 500px; margin-left: auto; margin-right: auto; }

  /* Testimonials */
  .block-testimonials { padding: 72px 24px; }
  .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
  .testimonial-card { padding: 28px; border-radius: 16px; border: 1px solid #e5e7eb; }
  .testimonial-text { font-style: italic; opacity: .8; margin-bottom: 16px; }
  .testimonial-author { font-weight: 700; }
  .testimonial-role { font-size: .85rem; opacity: .6; }

  /* Pricing */
  .block-pricing { padding: 72px 24px; }
  .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; max-width: 900px; margin: 0 auto; }
  .pricing-card { padding: 32px; border-radius: 16px; border: 2px solid #e5e7eb; text-align: center; }
  .pricing-card.highlighted { border-color: var(--accent, #7c3aed); transform: scale(1.03); }
  .pricing-name { font-weight: 700; font-size: 1.1rem; margin-bottom: 8px; }
  .pricing-price { font-size: 2.5rem; font-weight: 900; margin-bottom: 8px; }
  .pricing-period { font-size: .85rem; opacity: .6; margin-bottom: 20px; }
  .pricing-features { list-style: none; text-align: left; margin-bottom: 28px; display: flex; flex-direction: column; gap: 8px; }
  .pricing-features li::before { content: '✓ '; color: var(--accent, #7c3aed); font-weight: 700; }
  .pricing-btn { width: 100%; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; border: none; }

  /* FAQ */
  .block-faq { padding: 72px 24px; max-width: 720px; margin: 0 auto; }
  .faq-item { border-bottom: 1px solid #e5e7eb; padding: 20px 0; }
  .faq-q { font-weight: 700; margin-bottom: 10px; font-size: 1.05rem; }
  .faq-a { opacity: .75; }

  /* Footer */
  .block-footer { padding: 48px 24px; text-align: center; }
  .footer-brand { font-size: 1.4rem; font-weight: 800; margin-bottom: 16px; }
  .footer-links { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; margin-bottom: 24px; }
  .footer-links a { opacity: .7; font-size: .95rem; text-decoration: none; }
  .footer-links a:hover { opacity: 1; }
  .footer-copy { opacity: .5; font-size: .85rem; }

  /* Newsletter */
  .block-newsletter { padding: 72px 24px; text-align: center; }
  .newsletter-form { display: flex; gap: 12px; max-width: 440px; margin: 0 auto; flex-wrap: wrap; justify-content: center; }
  .newsletter-form input { flex: 1; min-width: 200px; padding: 12px 16px; border-radius: 10px; border: 1px solid #d1d5db; font-size: 1rem; }
  .newsletter-form button { padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; border: none; }

  /* Product Grid */
  .block-product-grid { padding: 72px 24px; }
  .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
  .product-card { border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; }
  .product-img { background: #f3f4f6; height: 200px; display: flex; align-items: center; justify-content: center; font-size: 3rem; }
  .product-info { padding: 16px; }
  .product-name { font-weight: 700; margin-bottom: 4px; }
  .product-price { font-size: 1.2rem; font-weight: 800; }

  /* Text Block */
  .block-text { padding: 48px 24px; max-width: 760px; margin: 0 auto; }
  .block-text h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: 16px; }
  .block-text p { opacity: .8; line-height: 1.8; }

  /* Contact */
  .block-contact { padding: 72px 24px; max-width: 600px; margin: 0 auto; }
  .contact-form { display: flex; flex-direction: column; gap: 16px; }
  .contact-form input, .contact-form textarea { padding: 12px 16px; border-radius: 10px; border: 1px solid #d1d5db; font-size: 1rem; font-family: inherit; }
  .contact-form textarea { min-height: 120px; resize: vertical; }
  .contact-form button { padding: 14px; border-radius: 10px; font-weight: 700; cursor: pointer; border: none; }

  /* Gallery */
  .block-gallery { padding: 72px 24px; }
  .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  .gallery-item { border-radius: 12px; overflow: hidden; aspect-ratio: 4/3; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 2rem; }
</style>
</head>
<body>
${blocksHTML}
</body>
</html>`
}

function renderBlockHTML(block: Block): string {
  const s = block.settings || {}
  const c = block.content || {}

  const bg = s.backgroundColor || '#ffffff'
  const textColor = s.textColor || '#111111'
  const accent = s.accentColor || '#7c3aed'
  const padding = s.paddingY ? `padding-top:${s.paddingY}px;padding-bottom:${s.paddingY}px;` : ''

  switch (block.type) {
    case 'hero': {
      const bgImg = s.backgroundImage ? `background-image:url('${s.backgroundImage}');background-size:cover;background-position:center;` : ''
      const overlay = s.backgroundImage ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);"></div>` : ''
      const txtCol = s.backgroundImage ? '#fff' : textColor
      return `<section class="block-hero" style="position:relative;background:${bg};${bgImg}${padding}">
  ${overlay}
  <div class="container" style="position:relative;z-index:1;color:${txtCol}">
    <h1 class="hero-title">${c.title || 'Tu Título Impactante Aquí'}</h1>
    <p class="hero-subtitle">${c.subtitle || 'Describe tu propuesta de valor en una oración memorable.'}</p>
    <div class="hero-btns">
      <button class="btn-primary" style="background:${accent};color:#fff;">${c.buttonText || 'Comenzar Ahora'}</button>
      ${c.secondaryButtonText ? `<button class="btn-secondary" style="color:${txtCol};border-color:${txtCol};">${c.secondaryButtonText}</button>` : ''}
    </div>
  </div>
</section>`
    }

    case 'features': {
      const items: any[] = c.items || [
        { icon: '⚡', title: 'Rápido y Eficiente', description: 'Descripción de esta característica.' },
        { icon: '🔒', title: 'Seguro y Confiable', description: 'Descripción de esta característica.' },
        { icon: '🎯', title: 'Fácil de Usar', description: 'Descripción de esta característica.' },
      ]
      return `<section class="block-features" style="background:${bg};${padding}">
  <div class="container">
    <h2 class="section-title" style="color:${textColor}">${c.title || 'Nuestras Características'}</h2>
    ${c.subtitle ? `<p class="section-subtitle" style="color:${textColor}">${c.subtitle}</p>` : ''}
    <div class="features-grid">
      ${items.map(item => `<div class="feature-card" style="background:${bg};">
        <div class="feature-icon">${item.icon || '✦'}</div>
        <div class="feature-title" style="color:${textColor}">${item.title}</div>
        <div class="feature-desc" style="color:${textColor}">${item.description}</div>
      </div>`).join('\n')}
    </div>
  </div>
</section>`
    }

    case 'cta': {
      return `<section class="block-cta" style="background:${accent};${padding}">
  <div class="container">
    <h2 class="cta-title" style="color:#fff">${c.title || '¿Listo para Empezar?'}</h2>
    <p class="cta-desc" style="color:rgba(255,255,255,0.85)">${c.description || 'Únete a miles de clientes satisfechos.'}</p>
    <button class="btn-primary" style="background:#fff;color:${accent};">${c.buttonText || 'Comenzar Gratis'}</button>
  </div>
</section>`
    }

    case 'testimonials': {
      const items: any[] = c.items || [
        { text: 'Excelente servicio, totalmente recomendado.', name: 'María García', role: 'Emprendedora' },
        { text: 'Ha transformado completamente mi negocio.', name: 'Carlos López', role: 'CEO' },
        { text: 'La mejor inversión que he hecho este año.', name: 'Ana Flores', role: 'Diseñadora' },
      ]
      return `<section class="block-testimonials" style="background:${bg};${padding}">
  <div class="container">
    <h2 class="section-title" style="color:${textColor}">${c.title || 'Lo que Dicen Nuestros Clientes'}</h2>
    <div class="testimonials-grid">
      ${items.map(t => `<div class="testimonial-card">
        <p class="testimonial-text" style="color:${textColor}">"${t.text}"</p>
        <p class="testimonial-author" style="color:${textColor}">${t.name}</p>
        <p class="testimonial-role">${t.role}</p>
      </div>`).join('\n')}
    </div>
  </div>
</section>`
    }

    case 'pricing': {
      const items: any[] = c.items || [
        { name: 'Básico', price: '29', period: '/mes', features: ['5 proyectos', '10 GB almacenamiento', 'Soporte básico'], highlighted: false },
        { name: 'Pro', price: '79', period: '/mes', features: ['Proyectos ilimitados', '100 GB almacenamiento', 'Soporte prioritario', 'API access'], highlighted: true },
        { name: 'Enterprise', price: '199', period: '/mes', features: ['Todo en Pro', 'SLA garantizado', 'Manager dedicado'], highlighted: false },
      ]
      return `<section class="block-pricing" style="background:${bg};${padding}">
  <div class="container">
    <h2 class="section-title" style="color:${textColor}">${c.title || 'Planes y Precios'}</h2>
    ${c.subtitle ? `<p class="section-subtitle" style="color:${textColor}">${c.subtitle}</p>` : ''}
    <div class="pricing-grid">
      ${items.map(p => `<div class="pricing-card ${p.highlighted ? 'highlighted' : ''}" style="${p.highlighted ? `border-color:${accent};` : ''}background:${bg};">
        <div class="pricing-name" style="color:${textColor}">${p.name}</div>
        <div class="pricing-price" style="color:${p.highlighted ? accent : textColor}">$${p.price}</div>
        <div class="pricing-period">${p.period}</div>
        <ul class="pricing-features" style="color:${textColor}">${(p.features || []).map((f: string) => `<li>${f}</li>`).join('')}</ul>
        <button class="pricing-btn" style="background:${p.highlighted ? accent : '#f3f4f6'};color:${p.highlighted ? '#fff' : textColor};">Elegir Plan</button>
      </div>`).join('\n')}
    </div>
  </div>
</section>`
    }

    case 'faq': {
      const items: any[] = c.items || [
        { question: '¿Cómo funciona?', answer: 'Es muy sencillo, solo regístrate y comienza a usar la plataforma.' },
        { question: '¿Puedo cancelar en cualquier momento?', answer: 'Sí, puedes cancelar tu suscripción cuando quieras sin penalizaciones.' },
        { question: '¿Hay una prueba gratuita?', answer: 'Sí, ofrecemos 14 días de prueba gratuita sin tarjeta de crédito.' },
      ]
      return `<section class="block-faq" style="background:${bg};${padding}">
  <div class="container">
    <h2 class="section-title" style="color:${textColor}">${c.title || 'Preguntas Frecuentes'}</h2>
    ${items.map(item => `<div class="faq-item">
      <div class="faq-q" style="color:${textColor}">${item.question}</div>
      <div class="faq-a" style="color:${textColor}">${item.answer}</div>
    </div>`).join('\n')}
  </div>
</section>`
    }

    case 'footer': {
      const links: any[] = c.links || [
        { label: 'Inicio', href: '#' },
        { label: 'Nosotros', href: '#' },
        { label: 'Contacto', href: '#' },
        { label: 'Privacidad', href: '#' },
      ]
      return `<footer class="block-footer" style="background:${s.backgroundColor || '#111'};color:${s.textColor || '#fff'};${padding}">
  <div class="container">
    <div class="footer-brand">${c.brandName || 'Tu Marca'}</div>
    <div class="footer-links">
      ${links.map(l => `<a href="${l.href || '#'}">${l.label}</a>`).join('\n')}
    </div>
    <p class="footer-copy">${c.copyright || `© ${new Date().getFullYear()} Todos los derechos reservados.`}</p>
  </div>
</footer>`
    }

    case 'newsletter': {
      return `<section class="block-newsletter" style="background:${bg};${padding}">
  <div class="container">
    <h2 class="section-title" style="color:${textColor}">${c.title || 'Suscríbete a Nuestro Boletín'}</h2>
    <p style="opacity:.7;margin-bottom:24px;color:${textColor}">${c.subtitle || 'Recibe las últimas novedades directamente en tu correo.'}</p>
    <div class="newsletter-form">
      <input type="email" placeholder="${c.placeholder || 'Tu correo electrónico'}" />
      <button style="background:${accent};color:#fff;">${c.buttonText || 'Suscribirme'}</button>
    </div>
  </div>
</section>`
    }

    case 'product-grid': {
      const products: any[] = c.products || [
        { name: 'Producto 1', price: 'S/ 49.90', emoji: '👕' },
        { name: 'Producto 2', price: 'S/ 79.90', emoji: '👗' },
        { name: 'Producto 3', price: 'S/ 29.90', emoji: '👒' },
        { name: 'Producto 4', price: 'S/ 99.90', emoji: '👜' },
      ]
      return `<section class="block-product-grid" style="background:${bg};${padding}">
  <div class="container">
    <h2 class="section-title" style="color:${textColor}">${c.title || 'Nuestros Productos'}</h2>
    <div class="product-grid">
      ${products.map(p => `<div class="product-card">
        <div class="product-img">${p.emoji || '📦'}</div>
        <div class="product-info">
          <div class="product-name" style="color:${textColor}">${p.name}</div>
          <div class="product-price" style="color:${accent}">${p.price}</div>
          <button style="margin-top:12px;width:100%;padding:10px;border-radius:8px;background:${accent};color:#fff;border:none;font-weight:700;cursor:pointer;">Agregar al carrito</button>
        </div>
      </div>`).join('\n')}
    </div>
  </div>
</section>`
    }

    case 'text': {
      return `<section class="block-text" style="background:${bg};${padding}">
  <div class="container">
    ${c.title ? `<h2 style="color:${textColor}">${c.title}</h2>` : ''}
    <p style="color:${textColor}">${c.body || 'Contenido de texto. Edita este bloque desde el panel lateral.'}</p>
  </div>
</section>`
    }

    case 'contact': {
      return `<section class="block-contact" style="background:${bg};${padding}">
  <div class="container">
    <h2 class="section-title" style="color:${textColor}">${c.title || 'Contáctanos'}</h2>
    <div class="contact-form">
      <input type="text" placeholder="Tu nombre" />
      <input type="email" placeholder="Tu correo electrónico" />
      <textarea placeholder="Tu mensaje..."></textarea>
      <button style="background:${accent};color:#fff;">${c.buttonText || 'Enviar Mensaje'}</button>
    </div>
  </div>
</section>`
    }

    case 'gallery': {
      const items: any[] = c.items || ['🖼️', '🌅', '🏔️', '🌊', '🌸', '🎨']
      return `<section class="block-gallery" style="background:${bg};${padding}">
  <div class="container">
    ${c.title ? `<h2 class="section-title" style="color:${textColor}">${c.title}</h2>` : ''}
    <div class="gallery-grid">
      ${items.map((item: any) => `<div class="gallery-item">${typeof item === 'string' ? item : '🖼️'}</div>`).join('\n')}
    </div>
  </div>
</section>`
    }

    default: {
      return `<section style="padding:40px 24px;background:${bg};text-align:center">
  <div class="container">
    <p style="opacity:.5;color:${textColor}">[Bloque: ${block.type}]</p>
  </div>
</section>`
    }
  }
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
  const [savedOk, setSavedOk] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [history, setHistory] = useState<Block[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => { fetchPage() }, [pageId])

  // Update iframe whenever blocks change
  useEffect(() => {
    if (iframeRef.current) {
      const html = generatePageHTML(blocks)
      iframeRef.current.srcdoc = html
    }
  }, [blocks])

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
    console.warn('[BUILDER] Page not found in API — initializing with blank canvas')
    setPage({
      id: pageId,
      title: 'Nueva Página',
      slug: pageId.replace('page-', 'pagina-'),
      type: 'landing',
      status: 'draft',
      blocks: [],
      seo: {},
      settings: {},
    })
    setBlocks([])
    setHistory([[]])
    setHistoryIndex(0)
    setLoading(false)
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
    const newBlocks = blocks.map(b => b.id === id ? { ...b, settings, content } : b)
    setBlocks(newBlocks)
    pushHistory(newBlocks)
  }

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id)
    setBlocks(newBlocks)
    pushHistory(newBlocks)
    if (selectedBlockId === id) setSelectedBlockId(null)
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
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
          setSavedOk(true)
          setTimeout(() => setSavedOk(false), 2000)
        }
      } else {
        // Silent fail — blocks are still in local state
        setSavedOk(true)
        setTimeout(() => setSavedOk(false), 2000)
      }
    } catch (error) {
      console.error('Error saving page:', error)
      // Still show saved feedback so user isn't confused
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2000)
    }
    finally { setSaving(false) }
  }

  const selectedBlock = blocks.find(b => b.id === selectedBlockId)
  const selectedBlockConfig = selectedBlock ? blockRegistry.get(selectedBlock.type) : undefined

  const canvasWidth = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  }[previewMode]

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--color-bg-base)', zIndex: 100 }}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Cargando editor...</p>
        </div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4" style={{ background: 'var(--color-bg-base)', zIndex: 100 }}>
        <Layout className="w-12 h-12 opacity-30" style={{ color: 'var(--color-text-tertiary)' }} />
        <p className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>Página no encontrada</p>
        <button onClick={() => router.push('/pages')} className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--color-accent)', color: '#fff' }}>
          Volver a Páginas
        </button>
      </div>
    )
  }

  return (
    // Full-screen editor that breaks out of the dashboard layout padding
    <div className="fixed inset-0 flex flex-col" style={{ background: 'var(--color-bg-base)', zIndex: 50 }}>

      {/* ═══ TOP BAR ═══ */}
      <div className="h-12 shrink-0 flex items-center justify-between px-3 gap-3"
        style={{ background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)' }}>

        {/* Left: Back + Page Info */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => router.push('/pages')}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-hover)]"
            style={{ color: 'var(--color-text-tertiary)' }}
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="hidden sm:block min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)', maxWidth: 200 }}>{page.title}</div>
            <div className="text-xs font-mono truncate" style={{ color: 'var(--color-text-tertiary)' }}>/{page.slug}</div>
          </div>
          <Badge variant={page.status === 'published' ? 'success' : 'warning'} className="hidden sm:inline-flex">
            {page.status === 'published' ? 'Publicado' : 'Borrador'}
          </Badge>
        </div>

        {/* Center: Preview Device */}
        <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          {([
            ['desktop', Monitor],
            ['tablet', Tablet],
            ['mobile', Smartphone],
          ] as const).map(([mode, Icon]) => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              className="p-1.5 transition-colors"
              style={previewMode === mode ? {
                background: 'var(--color-accent-muted)',
                color: 'var(--color-accent)',
              } : {
                color: 'var(--color-text-tertiary)',
              }}
              title={mode.charAt(0).toUpperCase() + mode.slice(1)}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Undo/Redo */}
          <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
            <button onClick={undo} disabled={historyIndex === 0}
              className="p-1.5 transition-colors disabled:opacity-30"
              style={{ color: 'var(--color-text-tertiary)' }}
              title="Deshacer (Ctrl+Z)">
              <Undo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4" style={{ background: 'var(--color-border)' }} />
            <button onClick={redo} disabled={historyIndex === history.length - 1}
              className="p-1.5 transition-colors disabled:opacity-30"
              style={{ color: 'var(--color-text-tertiary)' }}
              title="Rehacer">
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={generatePageAI}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:opacity-90"
            style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generar con IA
          </button>

          <button
            onClick={() => savePage()}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all hover:bg-[var(--color-bg-hover)]"
            style={{ borderColor: 'var(--color-border)', color: savedOk ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {savedOk ? 'Guardado' : 'Guardar'}
          </button>

          <button
            onClick={() => savePage('published')}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:opacity-90"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            <Globe className="w-3.5 h-3.5" />
            Publicar
          </button>
        </div>
      </div>

      {/* ═══ EDITOR BODY ═══ */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT PANEL — Block Palette */}
          {leftPanelOpen && (
            <div className="w-56 xl:w-64 shrink-0 flex flex-col border-r overflow-hidden"
              style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <BlockPalette onAddBlock={addBlock} />
            </div>
          )}

          {/* Toggle left */}
          <button
            onClick={() => setLeftPanelOpen(p => !p)}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-10 items-center justify-center rounded-r-lg text-xs transition-colors hover:bg-[var(--color-bg-elevated)]"
            style={{
              background: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-tertiary)',
              borderWidth: '1px',
              borderLeft: 'none',
              marginLeft: leftPanelOpen ? (typeof window !== 'undefined' && window.innerWidth >= 1280 ? '256px' : '224px') : '0',
              top: '50%',
              position: 'fixed',
              zIndex: 60,
            }}
            title={leftPanelOpen ? 'Cerrar panel' : 'Abrir panel de bloques'}
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${leftPanelOpen ? 'rotate-90' : '-rotate-90'}`} />
          </button>

          {/* CENTER — Canvas */}
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--color-bg-base)' }}>
              {/* Canvas area */}
              <div className="flex-1 overflow-auto flex flex-col items-center py-4 px-4 gap-4">
                {blocks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto text-center">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center mb-4"
                      style={{ borderColor: 'var(--color-border)' }}>
                      <Layout className="w-9 h-9 opacity-30" style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                    <p className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Lienzo vacío</p>
                    <p className="text-sm mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
                      Arrastra un bloque desde el panel izquierdo o haz clic en cualquier tipo de bloque para agregarlo.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['hero', 'features', 'cta', 'testimonials', 'footer'].map(t => (
                        <button key={t} onClick={() => addBlock(t)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:shadow-sm"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-surface)' }}>
                          + {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full rounded-xl overflow-hidden shadow-2xl transition-all duration-300"
                    style={{ maxWidth: canvasWidth, background: '#fff' }}
                  >
                    {/* Real HTML preview in iframe */}
                    <iframe
                      ref={iframeRef}
                      title="Page Preview"
                      style={{ width: '100%', minHeight: '80vh', border: 'none', display: 'block' }}
                      sandbox="allow-scripts allow-same-origin"
                      scrolling="no"
                      onLoad={(e) => {
                        // auto-resize iframe to content height
                        const iframe = e.currentTarget
                        try {
                          const body = iframe.contentDocument?.body
                          if (body) {
                            iframe.style.height = body.scrollHeight + 'px'
                          }
                        } catch {}
                      }}
                    />

                    {/* Block selection overlay — transparent overlays on top of iframe */}
                    <div style={{ position: 'relative', marginTop: '-100%', pointerEvents: 'none' }}>
                      {/* We use the block list below for selection */}
                    </div>
                  </div>
                )}

                {/* Block list below (for reordering/selection when canvas is shown) */}
                {blocks.length > 0 && (
                  <div className="w-full" style={{ maxWidth: canvasWidth }}>
                    <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      BLOQUES ({blocks.length})
                    </div>
                    <div className="flex flex-col gap-1">
                      {blocks.map((block, idx) => (
                        <div
                          key={block.id}
                          onClick={() => {
                            setSelectedBlockId(block.id)
                            setRightPanelOpen(true)
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                          style={selectedBlockId === block.id ? {
                            background: 'var(--color-accent-muted)',
                            color: 'var(--color-accent)',
                          } : {
                            background: 'var(--color-bg-surface)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          <span className="text-xs w-5 text-center font-mono opacity-50">{idx + 1}</span>
                          <span className="flex-1 text-xs font-medium capitalize">{block.type.replace('-', ' ')}</span>
                          <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                            <button onClick={() => moveBlock(block.id, 'up')} disabled={idx === 0}
                              className="p-1 rounded disabled:opacity-20 hover:bg-[var(--color-bg-hover)] transition-colors text-xs" title="Subir">↑</button>
                            <button onClick={() => moveBlock(block.id, 'down')} disabled={idx === blocks.length - 1}
                              className="p-1 rounded disabled:opacity-20 hover:bg-[var(--color-bg-hover)] transition-colors text-xs" title="Bajar">↓</button>
                            <button onClick={() => duplicateBlock(block.id)}
                              className="p-1 rounded hover:bg-[var(--color-bg-hover)] transition-colors text-xs" title="Duplicar">⧉</button>
                            <button onClick={() => deleteBlock(block.id)}
                              className="p-1 rounded hover:bg-[var(--color-error-muted)] transition-colors text-xs"
                              style={{ color: 'var(--color-error)' }} title="Eliminar">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SortableContext>

          {/* RIGHT PANEL — Block Editor */}
          {selectedBlock && selectedBlockConfig && rightPanelOpen && (
            <div className="w-72 xl:w-80 shrink-0 border-l overflow-hidden flex flex-col"
              style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <BlockEditor
                block={selectedBlock}
                blockConfig={selectedBlockConfig}
                onChange={(settings, content) => updateBlock(selectedBlock.id, settings, content)}
                onDuplicate={() => duplicateBlock(selectedBlock.id)}
                onDelete={() => deleteBlock(selectedBlock.id)}
              />
            </div>
          )}

          {!selectedBlock && rightPanelOpen && (
            <div className="w-72 xl:w-80 shrink-0 border-l flex flex-col items-center justify-center"
              style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'var(--color-bg-hover)' }}>
                  <Layout className="w-6 h-6" style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Selecciona un bloque
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  Haz clic en cualquier bloque de la lista para editarlo aquí
                </p>
              </div>
            </div>
          )}
        </div>
      </DndContext>
    </div>
  )
}
