export interface UIUXSkill {
  id: string
  name: string
  type: 'store' | 'landing' | 'corporate' | 'fashion' | 'services'
  description: string
  industries: string[]
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
  seoGeoRules: string[]
}

export const UI_UX_SKILLS: Record<string, UIUXSkill> = {
  // ═══════════════════ TIENDAS VIRTUALES (multi-ventana) ═══════════════════
  fashion_store: {
    id: 'fashion_store',
    name: 'UI/UX Skill: Fashion & Clothes E-Commerce',
    type: 'store',
    industries: ['moda', 'fashion', 'ropa', 'vestir', 'calzado', 'niños', 'kids', 'infantil'],
    description: 'Estándares estrictos de diseño para tiendas de ropa y moda: fotografía limpia, insignias de descuento, selector de tallas y CTAs en tonos rosa/rose.',
    requiredBlockSequence: ['navbar', 'hero', 'product-grid', 'features', 'testimonials', 'countdown', 'faq', 'cta', 'footer'],
    designSystemRules: {
      fontFamily: 'Inter, system-ui, sans-serif',
      colorPalette: { bg: '#ffffff', text: '#111827', accent: '#f43f5e', badgeBg: '#fff1f2' },
      borderRadius: '16px',
      paddingVertical: 72,
    },
    conversionRules: [
      'Insignias visibles con % de Descuento en productos',
      'Precios resaltados en Soles (S/) con precio tachado original',
      'Selector de tallas/tamaños en cada tarjeta de producto',
      'Garantía de cambio de talla sin costo',
      'Botón directo de compra por WhatsApp o Pasarela',
      'Navegación por ventanas: Inicio, categorías y landing por producto',
    ],
    seoGeoRules: [
      'JSON-LD Product por cada producto (nombre, precio S/, descuento, tallas, imagen, disponibilidad)',
      'FAQ de envío a Perú, tallas y devoluciones (rich results FAQPage)',
      'Keywords long-tail: "comprar [prenda] en [ciudad]"',
    ],
  },

  tech_ecommerce: {
    id: 'tech_ecommerce',
    name: 'UI/UX Skill: Tech & Gadgets E-Commerce',
    type: 'store',
    industries: ['tecnologia', 'tech', 'electronica', 'gadgets', 'gaming', 'computo', 'celulares'],
    description: 'Estándares de diseño para electrónica y tecnología: dark mode neón, fichas técnicas con íconos de rendimiento, contador de ofertas relámpago.',
    requiredBlockSequence: ['navbar', 'hero', 'product-grid', 'features', 'testimonials', 'countdown', 'faq', 'newsletter', 'footer'],
    designSystemRules: {
      fontFamily: 'Inter, system-ui, sans-serif',
      colorPalette: { bg: '#090d16', text: '#ffffff', accent: '#3b82f6', badgeBg: '#1e293b' },
      borderRadius: '20px',
      paddingVertical: 80,
    },
    conversionRules: [
      'Modo oscuro neón con acentos azules/púrpura',
      'Fichas técnicas con íconos de spec (Batería, ANC, Bluetooth)',
      'Garantía oficial 12 meses destacada',
      'Envío express 2 horas en Lima destacado en navbar',
    ],
    seoGeoRules: [
      'JSON-LD Product con especificaciones técnicas',
      'FAQ de garantía, envío express y soporte técnico',
      'Keywords: "mejor [gadget] 2026", "comprar [producto] online Perú"',
    ],
  },

  food_ecommerce: {
    id: 'food_ecommerce',
    name: 'UI/UX Skill: Food, Beverages & Gourmet Store',
    type: 'store',
    industries: ['gastronomia', 'food', 'comida', 'vinos', 'gourmet', 'restaurante', 'delicatessen', 'bebidas'],
    description: 'Diseño distinguido para vinos, delicatessen y alimentos premium: paleta cálida, empaques de regalo, maridaje y cajas corporativas.',
    requiredBlockSequence: ['navbar', 'hero', 'product-grid', 'features', 'testimonials', 'faq', 'cta', 'footer'],
    designSystemRules: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      colorPalette: { bg: '#1c1917', text: '#fef3c7', accent: '#d97706', badgeBg: '#fef3c7' },
      borderRadius: '18px',
      paddingVertical: 76,
    },
    conversionRules: [
      'Empaque térmico y conservación destacados',
      'Cajas de regalo corporativas con personalización',
      'Asesoría de maridaje/sommelier por WhatsApp',
      'Precios en Soles con descuentos por volumen',
    ],
    seoGeoRules: [
      'JSON-LD Product para vinos/quesos (denominación, añada, origen)',
      'FAQ de conservación, envío refrigerado y regalos corporativos',
      'Keywords: "comprar [vino/queso] en [ciudad]", "hampers corporativos"',
    ],
  },

  general_store: {
    id: 'general_store',
    name: 'UI/UX Skill: General E-Commerce Store',
    type: 'store',
    industries: ['general', 'tienda', 'ecommerce', 'retail', 'regalos', 'hogar', 'belleza'],
    description: 'Tienda online versátil con catálogo multi-categoría, ofertas flash, valoraciones de clientes y proceso de compra simple por WhatsApp.',
    requiredBlockSequence: ['navbar', 'hero', 'product-grid', 'features', 'testimonials', 'countdown', 'faq', 'newsletter', 'cta', 'footer'],
    designSystemRules: {
      fontFamily: 'Inter, system-ui, sans-serif',
      colorPalette: { bg: '#ffffff', text: '#0f172a', accent: '#ec4899', badgeBg: '#fdf2f8' },
      borderRadius: '14px',
      paddingVertical: 68,
    },
    conversionRules: [
      'Catálogo con pestañas por categoría (ventanas)',
      'Ofertas flash con countdown visible',
      'Testimonios verificados con nombre y ciudad',
      'Envío gratis a partir de cierto monto',
    ],
    seoGeoRules: [
      'JSON-LD Product + ItemList para el catálogo',
      'FAQ de envíos, pagos (Yape/Plin/tarjetas) y cambios',
      'Keywords: "tienda online [producto] [ciudad]"',
    ],
  },

  // ═══════════════════ LANDING PAGES (una sola ventana) ═══════════════════
  landing_page: {
    id: 'landing_page',
    name: 'UI/UX Skill: High-Converting Landing Page',
    type: 'landing',
    industries: ['landing', 'leads', 'infoproducto', 'curso', 'marketing', 'digital'],
    description: 'Estructura optimizada para captación de leads y ventas de infoproductos o servicios: hero con valor claro, prueba social, precios y FAQ de objeciones.',
    requiredBlockSequence: ['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'contact', 'footer'],
    designSystemRules: {
      fontFamily: 'Inter, system-ui, sans-serif',
      colorPalette: { bg: '#ffffff', text: '#0f172a', accent: '#8b5cf6', badgeBg: '#f3e8ff' },
      borderRadius: '14px',
      paddingVertical: 64,
    },
    conversionRules: [
      'Hero con propuesta de valor clara y 2 botones CTA',
      'Matriz de precios transparente con plan destacado',
      'Prueba social con números (clientes, rating)',
      'FAQ colapsable que resuelve objeciones de compra',
      'CTA repetido al final con urgencia (bonus/plazas limitadas)',
    ],
    seoGeoRules: [
      'JSON-LD FAQPage + Product/Offer para el plan principal',
      'metaDescription con CTA y keyword principal',
      'Keywords: "curso [tema]", "servicio [x] en [ciudad]"',
    ],
  },

  saas_landing: {
    id: 'saas_landing',
    name: 'UI/UX Skill: SaaS & Software Landing',
    type: 'landing',
    industries: ['software', 'saas', 'app', 'plataforma', 'tecnologia', 'b2b'],
    description: 'Landing para productos digitales y SaaS: problema-solución, features, demo CTA, pricing mensual y testimonios de empresas.',
    requiredBlockSequence: ['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'footer'],
    designSystemRules: {
      fontFamily: 'Inter, system-ui, sans-serif',
      colorPalette: { bg: '#ffffff', text: '#0f172a', accent: '#2563eb', badgeBg: '#dbeafe' },
      borderRadius: '16px',
      paddingVertical: 72,
    },
    conversionRules: [
      'Hero con problema → solución y CTA "Probar gratis"',
      'Features con íconos y beneficios medibles',
      'Pricing mensual/anual con plan recomendado',
      'Testimonios B2B con cargo y empresa',
    ],
    seoGeoRules: [
      'JSON-LD SoftwareApplication/Product',
      'FAQ de precios, demo y migración',
      'Keywords: "software [x]", "plataforma [y] para empresas"',
    ],
  },

  local_business_landing: {
    id: 'local_business_landing',
    name: 'UI/UX Skill: Local Business & Services Landing',
    type: 'landing',
    industries: ['local', 'servicios', 'salon', 'spa', 'abogado', 'contador', 'consultoria', 'inmobiliaria'],
    description: 'Landing para negocios locales y servicios profesionales: credibilidad, testimonios, certificaciones, ubicación y reserva/contacto directo.',
    requiredBlockSequence: ['hero', 'features', 'testimonials', 'contact', 'faq', 'cta', 'footer'],
    designSystemRules: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      colorPalette: { bg: '#ffffff', text: '#1e293b', accent: '#0ea5e9', badgeBg: '#e0f2fe' },
      borderRadius: '12px',
      paddingVertical: 60,
    },
    conversionRules: [
      'Credibilidad: años de experiencia, certificaciones, rating',
      'Testimonios con nombre real y servicio contratado',
      'Botón de WhatsApp/llamada flotante visible',
      'Formulario de contacto corto (nombre + teléfono)',
    ],
    seoGeoRules: [
      'JSON-LD LocalBusiness (dirección, horario, teléfono, geo)',
      'keywords: "[servicio] en [ciudad]", "mejor [servicio] cerca de mi"',
      'GEO: responder preguntas "¿cuánto cuesta?", "¿qué incluye?"',
    ],
  },

  // ═══════════════════ PÁGINAS CORPORATIVAS (multi-sección) ═══════════════════
  corporate_services: {
    id: 'corporate_services',
    name: 'UI/UX Skill: Corporate Services & B2B',
    type: 'corporate',
    industries: ['corporativo', 'b2b', 'consultoria', 'empresa', 'servicios', 'logistica', 'construccion'],
    description: 'Sitio corporativo B2B: hero institucional, servicios detallados, casos de éxito, certificaciones, equipo y contacto comercial.',
    requiredBlockSequence: ['navbar', 'hero', 'features', 'about', 'gallery', 'testimonials', 'contact', 'footer'],
    designSystemRules: {
      fontFamily: 'Inter, system-ui, sans-serif',
      colorPalette: { bg: '#ffffff', text: '#0f172a', accent: '#2563eb', badgeBg: '#dbeafe' },
      borderRadius: '12px',
      paddingVertical: 72,
    },
    conversionRules: [
      'Hero institucional con propuesta de valor B2B',
      'Servicios con alcance, entregables y plazos',
      'Casos de éxito / clientes con logos',
      'Formulario de cotización y contacto comercial',
      'Certificaciones y años de experiencia destacados',
    ],
    seoGeoRules: [
      'JSON-LD Organization + ProfessionalService',
      'FAQ institucional (¿qué hacemos?, ¿dónde operamos?)',
      'Keywords: "empresa de [servicio] en [ciudad]", "[servicio] corporativo"',
    ],
  },

  professional_corporate: {
    id: 'professional_corporate',
    name: 'UI/UX Skill: Professional Agency & Consulting',
    type: 'corporate',
    industries: ['agencia', 'consultora', 'estudio', 'legal', 'financiero', 'marketing', 'diseno'],
    description: 'Web para agencias y consultoras: portafolio elegante, procesos, equipo, metodología y CTA de agendar reunión.',
    requiredBlockSequence: ['navbar', 'hero', 'about', 'features', 'gallery', 'team', 'testimonials', 'contact', 'footer'],
    designSystemRules: {
      fontFamily: 'Inter, system-ui, sans-serif',
      colorPalette: { bg: '#fafafa', text: '#18181b', accent: '#6366f1', badgeBg: '#e0e7ff' },
      borderRadius: '16px',
      paddingVertical: 76,
    },
    conversionRules: [
      'Portafolio con proyectos destacados y métricas',
      'Proceso en 4 pasos (diagnóstico → entrega)',
      'Equipo con fotos y roles',
      'CTA "Agenda una consultoría gratis"',
    ],
    seoGeoRules: [
      'JSON-LD ProfessionalService + Person para el equipo',
      'FAQ de metodología, plazos y tarifas',
      'Keywords: "agencia de [x] en [ciudad]", "consultoría [y]"',
    ],
  },

  general_corporate: {
    id: 'general_corporate',
    name: 'UI/UX Skill: Corporate Institutional Site',
    type: 'corporate',
    industries: ['institucional', 'corporativa', 'empresa', 'organizacion', 'ong', 'gobierno'],
    description: 'Sitio institucional de empresa/organización: misión-visión-valores, áreas, noticias de la empresa, transparencia y contacto.',
    requiredBlockSequence: ['navbar', 'hero', 'about', 'features', 'team', 'gallery', 'contact', 'footer'],
    designSystemRules: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      colorPalette: { bg: '#ffffff', text: '#0f172a', accent: '#0f766e', badgeBg: '#ccfbf1' },
      borderRadius: '12px',
      paddingVertical: 68,
    },
    conversionRules: [
      'Hero institucional con propuesta de valor',
      'Misión, visión y valores claros',
      'Áreas/divisiones de la organización',
      'Datos de contacto, horarios y ubicación',
    ],
    seoGeoRules: [
      'JSON-LD Organization (fundación, ubicación, contacto)',
      'FAQ institucional',
      'Keywords: "[nombre empresa] [ciudad]", "empresa [rubro]"',
    ],
  },
}

/** All skills flattened for listing in the panel. */
export const ALL_UI_UX_SKILLS: UIUXSkill[] = Object.values(UI_UX_SKILLS)
