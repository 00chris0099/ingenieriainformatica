import { PageTemplate } from '../types'

export const ecommerceModern: PageTemplate = {
  id: 'ecommerce-modern',
  name: 'E-Commerce Moderno',
  description: 'Tienda online elegante con catálogo, testimonials y CTA',
  industry: 'ecommerce',
  category: 'store',
  blocks: [
    {
      id: 'hero-ecommerce',
      type: 'hero',
      settings: {
        variant: 'centered',
        height: 'full',
        backgroundType: 'gradient',
        backgroundColor: '#7c3aed',
        textColor: '#ffffff',
        overlayOpacity: 0,
        textAlign: 'center',
        paddingY: '120px',
      },
      content: {
        title: 'Descubre Nuestra Colección',
        subtitle: 'Productos de calidad diseñados para ti. Envío gratis en pedidos mayores a $50.',
        buttonText: 'Ver Catálogo',
        buttonLink: '#catalogo',
        buttonVariant: 'primary',
        secondaryButtonText: 'Ofertas',
        secondaryButtonLink: '#ofertas',
      },
    },
    {
      id: 'features-ecommerce',
      type: 'features',
      settings: {
        columns: 4,
        layout: 'horizontal',
        iconStyle: 'rounded',
        iconColor: '#7c3aed',
      },
      content: {
        title: '¿Por qué comprarnos?',
        items: [
          { title: 'Envío Gratis', description: 'En pedidos mayores a $50', icon: 'truck' },
          { title: 'Pago Seguro', description: 'Múltiples métodos de pago', icon: 'shield' },
          { title: 'Devoluciones', description: '30 días de garantía', icon: 'refresh-cw' },
          { title: 'Soporte 24/7', description: 'Estamos para ayudarte', icon: 'headphones' },
        ],
      },
    },
    {
      id: 'products-ecommerce',
      type: 'product-grid',
      settings: {
        columns: 4,
        showPrices: true,
        showAddToCart: true,
        showBadges: true,
        badgeStyle: 'ribbon',
      },
      content: {
        title: 'Productos Destacados',
        subtitle: 'Los más vendidos de nuestra tienda',
      },
    },
    {
      id: 'testimonials-ecommerce',
      type: 'testimonials',
      settings: {
        layout: 'carousel',
        columns: 3,
        showRating: true,
        avatarStyle: 'circle',
      },
      content: {
        title: 'Lo que dicen nuestros clientes',
        items: [
          { name: 'María García', role: 'Cliente frecuente', text: 'Excelente calidad y el envío fue súper rápido. Totalmente recomendado.', rating: 5 },
          { name: 'Carlos López', role: 'Comprador online', text: 'La mejor tienda online que he encontrado. Productos de primera.', rating: 5 },
          { name: 'Ana Torres', role: 'Nueva clienta', text: 'Me encantó el servicio al cliente. Resolvieron todas mis dudas.', rating: 5 },
        ],
      },
    },
    {
      id: 'cta-ecommerce',
      type: 'cta',
      settings: {
        variant: 'gradient',
        backgroundColor: '#7c3aed',
        textColor: '#ffffff',
        textAlign: 'center',
        paddingY: '80px',
      },
      content: {
        title: 'Suscríbete y Obtén 15% OFF',
        subtitle: 'Sé el primero en conocer nuestras ofertas y novedades.',
        buttonText: 'Suscribirme',
        buttonLink: '#newsletter',
      },
    },
    {
      id: 'footer-ecommerce',
      type: 'footer',
      settings: {
        variant: 'full',
        backgroundColor: '#111827',
        textColor: '#ffffff',
        columns: 4,
      },
      content: {
        companyName: 'Mi Tienda',
        tagline: 'Tu tienda online de confianza',
        copyright: '© 2026 Mi Tienda. Todos los derechos reservados.',
      },
    },
  ],
  theme: {
    fonts: { heading: 'Inter', body: 'Inter' },
    colors: {
      primary: '#7c3aed',
      secondary: '#ec4899',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#111827',
      muted: '#6b7280',
    },
    spacing: { section: '96px', block: '24px', container: '1200px' },
    borderRadius: '12px',
    shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.07)', lg: '0 10px 25px rgba(0,0,0,0.1)' },
  },
  seo: {
    metaTitle: 'Mi Tienda - Productos de Calidad Online',
    metaDescription: 'Compra los mejores productos online con envío gratis. Ofertas exclusivas y pago seguro.',
    keywords: ['tienda online', 'comprar', 'envío gratis', 'ofertas'],
  },
  settings: {},
}
