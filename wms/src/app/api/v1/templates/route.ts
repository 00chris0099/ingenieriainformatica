import { NextRequest } from 'next/server'
import { apiPaginated, parsePagination, getSearchParam } from '@/lib/api'

// Built-in templates hardcoded — work even when DB is down
const BUILTIN_TEMPLATES = [
  {
    id: 'tpl-moda-tienda',
    name: 'Tienda de Moda',
    description: 'Plantilla completa para tiendas de ropa, zapatos y accesorios. Incluye hero, catálogo, testimonios, CTA y footer.',
    industry: 'moda',
    thumbnail: null,
    blocks: [
      {
        id: 'b1', type: 'hero',
        settings: { backgroundColor: '#0f0f0f', textColor: '#ffffff', accentColor: '#f43f5e', paddingY: 100 },
        content: {
          title: 'Moda que Transforma tu Estilo',
          subtitle: 'Descubre colecciones exclusivas diseñadas para destacar en cada ocasión.',
          buttonText: 'Ver Colección',
          secondaryButtonText: 'Ver Lookbook',
        }
      },
      {
        id: 'b2', type: 'product-grid',
        settings: { backgroundColor: '#ffffff', textColor: '#111111', accentColor: '#f43f5e', paddingY: 72 },
        content: {
          title: 'Nuevos Ingresos',
          products: [
            { name: 'Vestido Verano', price: 'S/ 89.90', emoji: '👗' },
            { name: 'Zapatillas Sport', price: 'S/ 129.90', emoji: '👟' },
            { name: 'Bolso Cuero', price: 'S/ 199.90', emoji: '👜' },
            { name: 'Gorra Premium', price: 'S/ 49.90', emoji: '🧢' },
          ]
        }
      },
      {
        id: 'b3', type: 'features',
        settings: { backgroundColor: '#fafafa', textColor: '#111111', accentColor: '#f43f5e', paddingY: 64 },
        content: {
          title: 'Por qué elegirnos',
          items: [
            { icon: '🚚', title: 'Envío Gratis', description: 'En compras mayores a S/ 100 a todo el Perú.' },
            { icon: '↩️', title: 'Devoluciones', description: '30 días para cambios y devoluciones sin preguntas.' },
            { icon: '🔒', title: 'Pago Seguro', description: 'Yape, Plin, tarjetas y contra entrega.' },
          ]
        }
      },
      {
        id: 'b4', type: 'testimonials',
        settings: { backgroundColor: '#ffffff', textColor: '#111111', paddingY: 64 },
        content: {
          title: 'Clientes Felices',
          items: [
            { text: 'La calidad es increíble, llegó súper rápido y el empaque es hermoso.', name: 'Lucía M.', role: 'Lima' },
            { text: 'Ya voy por mi cuarto pedido. Siempre me sorprenden con prendas únicas.', name: 'Carla V.', role: 'Arequipa' },
            { text: 'Los mejores precios y atención al cliente de primera.', name: 'Sofía R.', role: 'Trujillo' },
          ]
        }
      },
      {
        id: 'b5', type: 'cta',
        settings: { accentColor: '#f43f5e', paddingY: 80 },
        content: { title: '¡Nueva Colección Disponible!', description: 'Registra tu correo y sé el primero en conocer nuestros nuevos diseños.', buttonText: 'Quiero Enterarme' }
      },
      {
        id: 'b6', type: 'footer',
        settings: { backgroundColor: '#0f0f0f', textColor: '#ffffff', paddingY: 48 },
        content: {
          brandName: 'MI TIENDA',
          copyright: '© 2025 Mi Tienda. Todos los derechos reservados.',
          links: [
            { label: 'Inicio', href: '#' },
            { label: 'Colecciones', href: '#' },
            { label: 'Contacto', href: '#' },
            { label: 'Políticas', href: '#' },
          ]
        }
      },
    ],
    seo: { title: 'Mi Tienda de Moda', description: 'Moda exclusiva al mejor precio.' },
    settings: { theme: 'dark-accent', primaryColor: '#f43f5e' },
    createdAt: new Date('2025-01-01').toISOString(),
  },

  {
    id: 'tpl-servicios-landing',
    name: 'Landing de Servicios',
    description: 'Ideal para agencias, consultoras y profesionales. Hero impactante, features, precios y formulario de contacto.',
    industry: 'servicios',
    thumbnail: null,
    blocks: [
      {
        id: 's1', type: 'hero',
        settings: { backgroundColor: '#1e1b4b', textColor: '#ffffff', accentColor: '#8b5cf6', backgroundImage: '', paddingY: 100 },
        content: {
          title: 'Soluciones Profesionales para tu Negocio',
          subtitle: 'Diseñamos estrategias digitales que convierten visitantes en clientes fieles.',
          buttonText: 'Solicitar Cotización',
          secondaryButtonText: 'Ver Casos de Éxito',
        }
      },
      {
        id: 's2', type: 'features',
        settings: { backgroundColor: '#ffffff', textColor: '#111111', accentColor: '#8b5cf6', paddingY: 72 },
        content: {
          title: 'Nuestros Servicios',
          subtitle: 'Todo lo que necesitas para crecer en el mundo digital.',
          items: [
            { icon: '🌐', title: 'Diseño Web', description: 'Sitios web modernos y optimizados para ventas.' },
            { icon: '📱', title: 'Marketing Digital', description: 'Estrategias en redes sociales y Google Ads.' },
            { icon: '🤖', title: 'Automatización IA', description: 'Chatbots y flujos automáticos para tu negocio.' },
            { icon: '📊', title: 'Analítica', description: 'Reportes y dashboards para decisiones inteligentes.' },
            { icon: '🔐', title: 'Ciberseguridad', description: 'Protección completa de tu infraestructura digital.' },
            { icon: '☁️', title: 'Cloud & Hosting', description: 'Servidores rápidos, seguros y escalables.' },
          ]
        }
      },
      {
        id: 's3', type: 'pricing',
        settings: { backgroundColor: '#f8f9fa', textColor: '#111111', accentColor: '#8b5cf6', paddingY: 72 },
        content: {
          title: 'Planes Transparentes',
          subtitle: 'Sin letra chica. Elige el plan que se adapta a tu negocio.',
          items: [
            { name: 'Starter', price: '299', period: '/mes', features: ['1 sitio web', 'Hosting incluido', 'Soporte básico', '5 páginas'], highlighted: false },
            { name: 'Pro', price: '799', period: '/mes', features: ['3 sitios web', 'Marketing digital', 'Soporte 24/7', 'Páginas ilimitadas', 'Chatbot IA'], highlighted: true },
            { name: 'Enterprise', price: '1,999', period: '/mes', features: ['Sitios ilimitados', 'Manager dedicado', 'SLA 99.9%', 'Todo incluido'], highlighted: false },
          ]
        }
      },
      {
        id: 's4', type: 'faq',
        settings: { backgroundColor: '#ffffff', textColor: '#111111', paddingY: 64 },
        content: {
          title: 'Preguntas Frecuentes',
          items: [
            { question: '¿Cuánto tiempo toma implementar un proyecto?', answer: 'La mayoría de proyectos web se entregan en 2-4 semanas. Proyectos más complejos pueden tomar entre 4-8 semanas.' },
            { question: '¿Puedo cancelar mi plan en cualquier momento?', answer: 'Sí, sin penalidades. Solo necesitas avisar con 15 días de anticipación.' },
            { question: '¿Incluyen soporte post-lanzamiento?', answer: 'Todos los planes incluyen 30 días de soporte gratuito post-lanzamiento.' },
          ]
        }
      },
      {
        id: 's5', type: 'contact',
        settings: { backgroundColor: '#1e1b4b', textColor: '#ffffff', accentColor: '#8b5cf6', paddingY: 72 },
        content: { title: 'Hablemos de tu Proyecto', buttonText: 'Enviar Mensaje' }
      },
      {
        id: 's6', type: 'footer',
        settings: { backgroundColor: '#111111', textColor: '#ffffff', paddingY: 40 },
        content: {
          brandName: 'AGENCIA DIGITAL',
          copyright: '© 2025 Agencia Digital. RUC 12345678901',
          links: [{ label: 'Servicios', href: '#' }, { label: 'Portafolio', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Contacto', href: '#' }]
        }
      },
    ],
    seo: { title: 'Agencia Digital - Servicios Profesionales', description: 'Soluciones digitales para empresas.' },
    settings: { theme: 'purple', primaryColor: '#8b5cf6' },
    createdAt: new Date('2025-01-01').toISOString(),
  },

  {
    id: 'tpl-restaurante',
    name: 'Restaurante & Comida',
    description: 'Perfecta para restaurantes, cafeterías, delivery y negocios de comida. Incluye menú, galería y reservas.',
    industry: 'gastronomia',
    thumbnail: null,
    blocks: [
      {
        id: 'r1', type: 'hero',
        settings: { backgroundColor: '#1a0a00', textColor: '#ffffff', accentColor: '#f97316', paddingY: 100 },
        content: {
          title: 'Sabores que Enamoran en Cada Bocado',
          subtitle: 'Cocina artesanal con los mejores ingredientes. Delivery en 30 minutos.',
          buttonText: 'Pedir Ahora',
          secondaryButtonText: 'Ver Menú',
        }
      },
      {
        id: 'r2', type: 'features',
        settings: { backgroundColor: '#fff7ed', textColor: '#111111', accentColor: '#f97316', paddingY: 64 },
        content: {
          title: 'Nuestra Propuesta',
          items: [
            { icon: '👨‍🍳', title: 'Chef Profesional', description: 'Cocineros con más de 10 años de experiencia.' },
            { icon: '🌿', title: 'Ingredientes Frescos', description: 'Insumos orgánicos seleccionados cada mañana.' },
            { icon: '🚀', title: 'Delivery Rápido', description: 'Tu pedido en 30 minutos o te descontamos el delivery.' },
          ]
        }
      },
      {
        id: 'r3', type: 'product-grid',
        settings: { backgroundColor: '#ffffff', textColor: '#111111', accentColor: '#f97316', paddingY: 72 },
        content: {
          title: 'Nuestro Menú Estrella',
          products: [
            { name: 'Ceviche Clásico', price: 'S/ 32.00', emoji: '🐟' },
            { name: 'Lomo Saltado', price: 'S/ 38.00', emoji: '🥩' },
            { name: 'Ají de Gallina', price: 'S/ 28.00', emoji: '🍛' },
            { name: 'Causa Rellena', price: 'S/ 24.00', emoji: '🥘' },
            { name: 'Arroz con Leche', price: 'S/ 12.00', emoji: '🍮' },
            { name: 'Chicha Morada', price: 'S/ 8.00', emoji: '🍇' },
          ]
        }
      },
      {
        id: 'r4', type: 'gallery',
        settings: { backgroundColor: '#fafafa', paddingY: 64 },
        content: {
          title: 'Nuestras Instalaciones',
          items: ['🍽️', '👨‍🍳', '🥗', '🍷', '🌿', '🏮']
        }
      },
      {
        id: 'r5', type: 'testimonials',
        settings: { backgroundColor: '#fff7ed', textColor: '#111111', paddingY: 64 },
        content: {
          title: 'Lo que Dicen Nuestros Clientes',
          items: [
            { text: 'El mejor ceviche de la ciudad. Fresco, sabroso y la atención es de 10.', name: 'Roberto P.', role: 'Cliente Frecuente' },
            { text: 'Pido delivery todos los viernes. Siempre llega caliente y a tiempo.', name: 'Mariella F.', role: 'Lima Norte' },
            { text: 'Celebramos el cumpleaños de mi mamá y fue una experiencia hermosa.', name: 'Andrés T.', role: 'Surco' },
          ]
        }
      },
      {
        id: 'r6', type: 'cta',
        settings: { accentColor: '#f97316', paddingY: 72 },
        content: { title: 'Haz tu Pedido Ahora', description: 'WhatsApp: +51 999 888 777 | Delivery disponible de 11am a 10pm', buttonText: 'Pedir por WhatsApp' }
      },
      {
        id: 'r7', type: 'footer',
        settings: { backgroundColor: '#1a0a00', textColor: '#ffffff', paddingY: 40 },
        content: {
          brandName: 'EL BUEN SABOR',
          copyright: '© 2025 El Buen Sabor. Todos los derechos reservados.',
          links: [{ label: 'Menú', href: '#' }, { label: 'Reservas', href: '#' }, { label: 'Delivery', href: '#' }, { label: 'Contacto', href: '#' }]
        }
      },
    ],
    seo: { title: 'Restaurante El Buen Sabor', description: 'Cocina artesanal y delivery rápido.' },
    settings: { theme: 'warm', primaryColor: '#f97316' },
    createdAt: new Date('2025-01-01').toISOString(),
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const industry = getSearchParam(searchParams, 'industry')
  const query = getSearchParam(searchParams, 'q')
  const { page, limit } = parsePagination(searchParams)

  let templates = [...BUILTIN_TEMPLATES]

  // Try to merge from template registry (non-critical)
  try {
    const { templateRegistry } = await import('@repo/templates')
    const dbTemplates = templateRegistry.getAll()
    // Merge without duplicates (built-in take priority by id)
    const builtinIds = new Set(templates.map(t => t.id))
    for (const t of dbTemplates) {
      if (!builtinIds.has(t.id)) templates.push(t as any)
    }
  } catch { /* template registry unavailable — built-ins are enough */ }

  if (industry) templates = templates.filter(t => t.industry === industry)
  if (query) {
    const q = query.toLowerCase()
    templates = templates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.industry.toLowerCase().includes(q)
    )
  }

  const total = templates.length
  const offset = (page - 1) * limit
  const items = templates.slice(offset, offset + limit)

  return apiPaginated(items, total, page, limit)
}
