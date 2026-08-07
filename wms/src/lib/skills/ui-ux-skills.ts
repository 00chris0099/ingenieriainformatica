export interface UIUXSkill {
  id: string
  name: string
  type: 'store' | 'landing' | 'fashion' | 'services'
  description: string
  requiredBlockSequence: string[]
  designSystemRules: {
    fontFamily: string
    colorPalette: {
      bg: string
      text: string
      accent: string
      badgeBg: string
    }
    borderRadius: string
    paddingVertical: number
  }
  conversionRules: string[]
}

export const UI_UX_SKILLS: Record<string, UIUXSkill> = {
  fashion_store: {
    id: 'fashion_store',
    name: 'UI/UX Skill: Fashion & Clothes E-Commerce',
    type: 'fashion',
    description: 'Estándares estrictos de diseño para tiendas de ropa y moda: fotografía limpia, insignias de descuento relucientes, selector de tallas y botones rosa/rose.',
    requiredBlockSequence: ['hero', 'product-grid', 'features', 'testimonials', 'cta', 'footer'],
    designSystemRules: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      colorPalette: {
        bg: '#ffffff',
        text: '#111827',
        accent: '#f43f5e',
        badgeBg: '#fff1f2',
      },
      borderRadius: '16px',
      paddingVertical: 72,
    },
    conversionRules: [
      'Insignias visibles con % de Descuento en productos',
      'Precios resaltados en Soles (S/)',
      'Garantía de cambio de talla sin costo',
      'Botón directo de compra por WhatsApp o Pasarela',
    ],
  },

  tech_ecommerce: {
    id: 'tech_ecommerce',
    name: 'UI/UX Skill: Tech & Gadgets E-Commerce',
    type: 'store',
    description: 'Estándares de diseño para electrónica y tecnología: dark mode neón, fichas técnicas con íconos de rendimiento, contador de ofertas relámpago.',
    requiredBlockSequence: ['hero', 'product-grid', 'features', 'cta', 'footer'],
    designSystemRules: {
      fontFamily: 'Inter, system-ui, sans-serif',
      colorPalette: {
        bg: '#090d16',
        text: '#ffffff',
        accent: '#3b82f6',
        badgeBg: '#1e293b',
      },
      borderRadius: '20px',
      paddingVertical: 80,
    },
    conversionRules: [
      'Modo oscuro neón con acentos azules/púrpura',
      'Fichas técnicas con íconos de spec (Batería, ANC, Bluetooth)',
      'Garantía oficial 12 meses destacada',
    ],
  },

  landing_page: {
    id: 'landing_page',
    name: 'UI/UX Skill: High-Converting Landing Page',
    type: 'landing',
    description: 'Estructura optimizada para captación de leads y ventas de infoproductos o servicios.',
    requiredBlockSequence: ['hero', 'features', 'pricing', 'faq', 'contact', 'footer'],
    designSystemRules: {
      fontFamily: 'system-ui, sans-serif',
      colorPalette: {
        bg: '#ffffff',
        text: '#0f172a',
        accent: '#8b5cf6',
        badgeBg: '#f3e8ff',
      },
      borderRadius: '14px',
      paddingVertical: 64,
    },
    conversionRules: [
      'Hero con propuesta de valor clara y 2 botones CTA',
      'Matriz de precios transparente en dólares o soles',
      'Sección de Preguntas Frecuentes colapsable',
    ],
  },
}
