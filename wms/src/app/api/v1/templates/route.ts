import { NextRequest } from 'next/server'
import { apiPaginated, parsePagination, getSearchParam } from '@/lib/api'

// 3 Complete E-Commerce Store Templates (Shopify/Framer level quality)
export const BUILTIN_TEMPLATES = [
  {
    id: 'tpl-adrisu-kids',
    name: 'Adrisu Kids - Moda Infantil',
    description: 'Tienda virtual e-commerce completa especializada en moda, calzado y ropa infantil. Incluye hero alegre, barra de anuncios, parrilla de vestidos/conjuntos, insignias de descuento, garantía de envío gratis y testimonios de mamás.',
    industry: 'moda_infantil',
    category: 'ecommerce',
    thumbnail: null,
    blocks: [
      {
        id: 'ak-hero', type: 'hero',
        settings: { backgroundColor: '#fff1f2', textColor: '#881337', accentColor: '#f43f5e', paddingY: 96 },
        content: {
          title: 'Adrisu Kids — Moda Feliz para los Pequeños',
          subtitle: 'Colecciones cómodas, divertidas y duraderas para niños de 0 a 14 años. Envíos el mismo día en Lima y provincias.',
          buttonText: 'Ver Ropa de Niños',
          secondaryButtonText: 'Ver Ofertas de Temporada',
        }
      },
      {
        id: 'ak-products', type: 'product-grid',
        settings: { backgroundColor: '#ffffff', textColor: '#111827', accentColor: '#f43f5e', paddingY: 72 },
        content: {
          title: 'Lo Más Vendido en Adrisu Kids',
          products: [
            { name: 'Conjunto Algodón Orgánico (2-6 años)', price: 'S/ 59.90', emoji: '👕' },
            { name: 'Vestido Fiesta Primavera Florcita', price: 'S/ 79.90', emoji: '👗' },
            { name: 'Zapatillas Luces Led Confort', price: 'S/ 99.90', emoji: '👟' },
            { name: 'Pijama Enterizo Térmico Bebé', price: 'S/ 45.00', emoji: '👶' },
            { name: 'Casaca Impermeable Capucha Osito', price: 'S/ 89.90', emoji: '🧥' },
            { name: 'Set 3 Polos Manga Corta Disney', price: 'S/ 49.90', emoji: '🎨' },
          ]
        }
      },
      {
        id: 'ak-features', type: 'features',
        settings: { backgroundColor: '#fff8f6', textColor: '#111827', accentColor: '#f43f5e', paddingY: 64 },
        content: {
          title: 'Por qué las Mamás Eligen Adrisu Kids',
          items: [
            { icon: '🌿', title: 'Algodón 100% Antialérgico', description: 'Cuidamos la piel sensible de tus hijos con telas orgánicas y suaves.' },
            { icon: '🚚', title: 'Envío Gratis desde S/ 120', description: 'Repartos a todo el Perú por Olva Courier y Shalom.' },
            { icon: '🔄', title: 'Cambio de Talla Sin Costo', description: 'Si la prenda no le queda, te la cambiamos de inmediato.' },
          ]
        }
      },
      {
        id: 'ak-testimonials', type: 'testimonials',
        settings: { backgroundColor: '#ffffff', textColor: '#111827', paddingY: 64 },
        content: {
          title: 'Lo que dicen las Mamás Adrisu',
          items: [
            { text: 'La ropa de Adrisu Kids es hermosísima y no se descolora al lavar. Mis hijos están felices.', name: 'Claudia M.', role: 'Mamá de 2 pequeños (San Borja)' },
            { text: 'Llegó en menos de 24 horas a Trujillo. La calidad del algodón superó mis expectativas.', name: 'Valeria S.', role: 'Mamá (Trujillo)' },
            { text: 'Atención A1 por WhatsApp. Me ayudaron a elegir la talla perfecta para mi bebé.', name: 'Patricia L.', role: 'Mamá de Mateo' },
          ]
        }
      },
      {
        id: 'ak-cta', type: 'cta',
        settings: { accentColor: '#f43f5e', paddingY: 80 },
        content: {
          title: '¡Únete al Club Adrisu y recibe 15% OFF!',
          description: 'Déjanos tu WhatsApp o correo y recibe tu cupón de regalo para tu primera compra.',
          buttonText: 'Obtener Mi Descuento 15% OFF'
        }
      },
      {
        id: 'ak-footer', type: 'footer',
        settings: { backgroundColor: '#881337', textColor: '#ffffff', paddingY: 48 },
        content: {
          brandName: 'ADRISU KIDS',
          copyright: '© 2026 Adrisu Kids. Moda Infantil de Alta Calidad. Todos los derechos reservados.',
          links: [
            { label: 'Inicio', href: '#' },
            { label: 'Niños', href: '#' },
            { label: 'Niñas', href: '#' },
            { label: 'Bebés', href: '#' },
            { label: 'Contacto WhatsApp', href: '#' },
          ]
        }
      },
    ],
    seo: { title: 'Adrisu Kids - Tienda de Moda Infantil', description: 'La mejor ropa y calzado para niños y bebés.' },
    settings: { theme: 'pink-rose', primaryColor: '#f43f5e' },
    createdAt: new Date('2026-01-01').toISOString(),
  },

  {
    id: 'tpl-techvibes',
    name: 'TechVibes - Gadgets & Electrónica',
    description: 'E-Commerce futurista neón en modo oscuro para gadgets, smartphones, audífonos bluetooth y tecnología de vanguardia. Incluye hero neón, ofertas relámpago, grid de specs y garantía oficial.',
    industry: 'tecnologia',
    category: 'ecommerce',
    thumbnail: null,
    blocks: [
      {
        id: 'tv-hero', type: 'hero',
        settings: { backgroundColor: '#090d16', textColor: '#ffffff', accentColor: '#3b82f6', paddingY: 100 },
        content: {
          title: 'TechVibes — El Futuro de la Tecnología en tus Manos',
          subtitle: 'Encuentra los gadgets más potentes, audífonos anc, smartwatch y accesorios gaming con garantía real.',
          buttonText: 'Ver Lanzamientos 2026',
          secondaryButtonText: 'Ofertas Relámpago',
        }
      },
      {
        id: 'tv-products', type: 'product-grid',
        settings: { backgroundColor: '#0f172a', textColor: '#ffffff', accentColor: '#3b82f6', paddingY: 72 },
        content: {
          title: 'Gadgets Más Buscados',
          products: [
            { name: 'Audífonos Bluetooth ANC Pro X', price: 'S/ 189.00', emoji: '🎧' },
            { name: 'Smartwatch Ultra Amoled GPS', price: 'S/ 249.00', emoji: '⌚' },
            { name: 'Parlante WaterProof 40W Bass', price: 'S/ 159.00', emoji: '🔊' },
            { name: 'Cargador MagSafe Fast 65W', price: 'S/ 79.00', emoji: '⚡' },
            { name: 'Teclado Mecánico RGB Wireless', price: 'S/ 219.00', emoji: '⌨️' },
            { name: 'Cámara 4K Ultra Action Cam', price: 'S/ 329.00', emoji: '📷' },
          ]
        }
      },
      {
        id: 'tv-features', type: 'features',
        settings: { backgroundColor: '#090d16', textColor: '#ffffff', accentColor: '#3b82f6', paddingY: 64 },
        content: {
          title: 'Experiencia TechVibes Premium',
          items: [
            { icon: '🛡️', title: 'Garantía 12 Meses Oficial', description: 'Todos los equipos cuentan con respaldo y soporte técnico local.' },
            { icon: '⚡', title: 'Delivery Express 3 Horas', description: 'Entregas súper rápidas en Lima Metropolitana.' },
            { icon: '💳', title: 'Pagos con Tarjeta o Yape', description: 'Paga con tarjeta de crédito, débito o billeteras digitales.' },
          ]
        }
      },
      {
        id: 'tv-cta', type: 'cta',
        settings: { accentColor: '#2563eb', paddingY: 80 },
        content: {
          title: '¿Quieres enterarte de los Drops Semanales?',
          description: 'Suscríbete para recibir notificaciones de nuevos lanzamientos tecnológicos antes que nadie.',
          buttonText: 'Unirme a la Comunidad Tech'
        }
      },
      {
        id: 'tv-footer', type: 'footer',
        settings: { backgroundColor: '#030712', textColor: '#ffffff', paddingY: 48 },
        content: {
          brandName: 'TECHVIBES STORE',
          copyright: '© 2026 TechVibes. Gadgets & High-Tech Store.',
          links: [
            { label: 'Lanzamientos', href: '#' },
            { label: 'Audífonos', href: '#' },
            { label: 'Smartwatches', href: '#' },
            { label: 'Soporte Técnico', href: '#' },
          ]
        }
      },
    ],
    seo: { title: 'TechVibes - Tienda de Tecnología', description: 'Los mejores gadgets y electrónica al mejor precio.' },
    settings: { theme: 'dark-blue', primaryColor: '#3b82f6' },
    createdAt: new Date('2026-01-01').toISOString(),
  },

  {
    id: 'tpl-boutique-gourmet',
    name: 'Boutique Gourmet - Vinos & Delicatessen',
    description: 'E-Commerce gastronómico refinado en tonos cálidos para tiendas de vinos, quesos artesanales, chocolates finos y charcutería. Incluye hero elegante, catálogo boutique, notas de cata y pedidos rápidos.',
    industry: 'gastronomia',
    category: 'ecommerce',
    thumbnail: null,
    blocks: [
      {
        id: 'bg-hero', type: 'hero',
        settings: { backgroundColor: '#1c1917', textColor: '#ffffff', accentColor: '#d97706', paddingY: 100 },
        content: {
          title: 'Boutique Gourmet — El Placer del Buen Gusto',
          subtitle: 'Vinos de reserva, quesos madurados, aceites de oliva virgen extra y charcutería fina traídos de los mejores productores.',
          buttonText: 'Ver Cava de Vinos',
          secondaryButtonText: 'Armar Tabla Gourmet',
        }
      },
      {
        id: 'bg-products', type: 'product-grid',
        settings: { backgroundColor: '#ffffff', textColor: '#1c1917', accentColor: '#d97706', paddingY: 72 },
        content: {
          title: 'Selección del Sommelier',
          products: [
            { name: 'Vino Malbec Gran Reserva 2020', price: 'S/ 120.00', emoji: '🍷' },
            { name: 'Queso Gouda Madurado 12 Meses', price: 'S/ 48.00', emoji: '🧀' },
            { name: 'Jamón Serrano Reserva Ibérico', price: 'S/ 85.00', emoji: '🥩' },
            { name: 'Aceite de Oliva Extra Virgen 500ml', price: 'S/ 42.00', emoji: '🫒' },
            { name: 'Chocolate Cacao 85% Orgánico', price: 'S/ 25.00', emoji: '🍫' },
            { name: 'Pack Maridaje Especial Regalo', price: 'S/ 210.00', emoji: '🎁' },
          ]
        }
      },
      {
        id: 'bg-features', type: 'features',
        settings: { backgroundColor: '#fffbeb', textColor: '#1c1917', accentColor: '#d97706', paddingY: 64 },
        content: {
          title: 'Garantía de Frescura y Origen',
          items: [
            { icon: '🍇', title: 'Vinos Seleccionados', description: 'Guardados a temperatura controlada en nuestra cava.' },
            { icon: '📦', title: 'Empaque Térmico Regalo', description: 'Presentaciones elegantes listas para obsequiar.' },
            { icon: '🍷', title: 'Asesoría de Sommelier', description: 'Atención personalizada por WhatsApp para tus eventos.' },
          ]
        }
      },
      {
        id: 'bg-cta', type: 'cta',
        settings: { accentColor: '#d97706', paddingY: 80 },
        content: {
          title: '¿Planeas una Cena o Evento Especial?',
          description: 'Escríbenos al WhatsApp y nuestro Sommelier te armará la tabla y maridaje perfecto.',
          buttonText: 'Cotizar por WhatsApp'
        }
      },
      {
        id: 'bg-footer', type: 'footer',
        settings: { backgroundColor: '#1c1917', textColor: '#ffffff', paddingY: 48 },
        content: {
          brandName: 'BOUTIQUE GOURMET',
          copyright: '© 2026 Boutique Gourmet & Cava Fine Dining.',
          links: [
            { label: 'Cava de Vinos', href: '#' },
            { label: 'Quesos & Charcutería', href: '#' },
            { label: 'Packs Regalo', href: '#' },
            { label: 'Contacto', href: '#' },
          ]
        }
      },
    ],
    seo: { title: 'Boutique Gourmet - Vinos & Delicatessen', description: 'Vinos de reserva y productos delicatessen artesanales.' },
    settings: { theme: 'amber-gold', primaryColor: '#d97706' },
    createdAt: new Date('2026-01-01').toISOString(),
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const industry = getSearchParam(searchParams, 'industry')
  const query = getSearchParam(searchParams, 'q')
  const { page, limit } = parsePagination(searchParams)

  let templates = [...BUILTIN_TEMPLATES]

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
