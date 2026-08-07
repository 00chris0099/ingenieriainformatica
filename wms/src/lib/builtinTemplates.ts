export const BUILTIN_TEMPLATES = [
  {
    id: 'tpl-adrisu-kids',
    name: 'Adrisu Kids - Moda Infantil',
    description: 'Tienda virtual e-commerce completa especializada en moda, calzado y ropa infantil. Incluye hero alegre, barra de anuncios, parrilla de vestidos/conjuntos, insignias de descuento, garantía de envío gratis y testimonios de mamás.',
    industry: 'moda_infantil',
    category: 'ecommerce',
    thumbnail: null,
    seo: {
      title: 'Adrisu Kids - Moda & Tendencias Infantiles',
      description: 'Ropa de alta calidad en algodón 100% antialérgico para niños y bebés.',
    },
    settings: {
      primaryColor: '#f43f5e',
      secondaryColor: '#fff1f2',
      accentColor: '#ec4899',
    },
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
          title: '¡CUPÓN 15% OFF EN TU PRIMERA COMPRA!',
          description: 'Únete al Club Adrisu Kids y recibe novedades exclusivas y regalos en el cumpleaños de tus hijos.',
          buttonText: 'Pedir por WhatsApp',
        }
      },
      {
        id: 'ak-footer', type: 'footer',
        settings: { backgroundColor: '#881337', textColor: '#ffffff', paddingY: 48 },
        content: {
          brandName: 'ADRISU KIDS PERÚ',
          copyright: '© 2026 Adrisu Kids. Todos los derechos reservados.',
        }
      }
    ]
  },
  {
    id: 'tpl-tech-vibes',
    name: 'TechVibes - Gadgets & Electrónica',
    description: 'Tienda de alta conversión en modo oscuro neón especializada en audífonos inalámbricos, smartwatches y accesorios tech.',
    industry: 'tecnologia',
    category: 'ecommerce',
    thumbnail: null,
    seo: {
      title: 'TechVibes - Gadgets & Tecnología',
      description: 'Audífonos, smartwatches y accesorios inteligentes con garantía oficial.',
    },
    settings: {
      primaryColor: '#3b82f6',
      secondaryColor: '#0f172a',
      accentColor: '#8b5cf6',
    },
    blocks: [
      {
        id: 'tv-hero', type: 'hero',
        settings: { backgroundColor: '#090d16', textColor: '#ffffff', accentColor: '#3b82f6', paddingY: 96 },
        content: {
          title: 'TechVibes — Tecnología de Siguiente Nivel',
          subtitle: 'Audífonos con cancelación de ruido, smartwatches y periféricos gamer con garantía oficial 12 meses.',
          buttonText: 'Ver Gadgets en Tendencia',
          secondaryButtonText: 'Ofertas Flash',
        }
      },
      {
        id: 'tv-products', type: 'product-grid',
        settings: { backgroundColor: '#0f172a', textColor: '#ffffff', accentColor: '#3b82f6', paddingY: 72 },
        content: {
          title: 'Novedades TechVibes',
          products: [
            { name: 'Audífonos ANC Pro Bass Wireless', price: 'S/ 189.00', emoji: '🎧' },
            { name: 'Smartwatch AMOLED Ultra Fit 2', price: 'S/ 229.00', emoji: '⌚' },
            { name: 'Cargador Carga Rápida GaN 65W', price: 'S/ 89.00', emoji: '⚡' },
            { name: 'Teclado Mecánico RGB Wireless 60%', price: 'S/ 249.00', emoji: '⌨️' },
          ]
        }
      },
      {
        id: 'tv-features', type: 'features',
        settings: { backgroundColor: '#090d16', textColor: '#ffffff', accentColor: '#3b82f6', paddingY: 64 },
        content: {
          title: 'La Garantía TechVibes',
          items: [
            { icon: '🛡️', title: 'Garantía Real 12 Meses', description: 'Reemplazo directo de producto si presenta algún defecto de fábrica.' },
            { icon: '⚡', title: 'Envío Express 2 Horas', description: 'Envíos veloces en Lima Metropolitana y despachos diarios a provincias.' },
            { icon: '🔒', title: 'Pago Contra Entrega', description: 'Paga con Yape, Plin o efectivo al recibir tu pedido en la puerta de tu casa.' },
          ]
        }
      },
      {
        id: 'tv-cta', type: 'cta',
        settings: { accentColor: '#3b82f6', paddingY: 80 },
        content: {
          title: 'OFERTAS FLASH HASTA 40% OFF',
          description: 'Stock limitado. Haz tu pedido por WhatsApp antes de que se agoten las unidades promocionales.',
          buttonText: 'Comprar por WhatsApp',
        }
      },
      {
        id: 'tv-footer', type: 'footer',
        settings: { backgroundColor: '#030712', textColor: '#ffffff', paddingY: 48 },
        content: {
          brandName: 'TECHVIBES STORE',
          copyright: '© 2026 TechVibes. Impulsado por WMS Platform.',
        }
      }
    ]
  },
  {
    id: 'tpl-boutique-gourmet',
    name: 'Boutique Gourmet - Vinos & Delicatessen',
    description: 'Diseño ultra elegante para tiendas de vinos, quesos madurados, chocolates finos y regalos gourmet corporativos.',
    industry: 'gastronomia',
    category: 'ecommerce',
    thumbnail: null,
    seo: {
      title: 'Boutique Gourmet - Vinos & Delicatessen',
      description: 'Vinos de reserva, licores finos y cajas de regalo corporativas.',
    },
    settings: {
      primaryColor: '#78350f',
      secondaryColor: '#fef3c7',
      accentColor: '#d97706',
    },
    blocks: [
      {
        id: 'bg-hero', type: 'hero',
        settings: { backgroundColor: '#1c1917', textColor: '#fef3c7', accentColor: '#d97706', paddingY: 96 },
        content: {
          title: 'Boutique Gourmet — El Placer de lo Exquisito',
          subtitle: 'Vinos de gran reserva, quesos artesanales, aceites de oliva virgen extra y hampers corporativos de lujo.',
          buttonText: 'Explorar Cava & Delicatessen',
          secondaryButtonText: 'Packs de Regalo',
        }
      },
      {
        id: 'bg-products', type: 'product-grid',
        settings: { backgroundColor: '#ffffff', textColor: '#1c1917', accentColor: '#d97706', paddingY: 72 },
        content: {
          title: 'Selección del Sommelier',
          products: [
            { name: 'Vino Gran Reserva Malbec Mendoza 2018', price: 'S/ 165.00', emoji: '🍷' },
            { name: 'Queso Trufado Artesanal Madurado', price: 'S/ 85.00', emoji: '🧀' },
            { name: 'Tabla Jamón Serrano 100% Ibérico', price: 'S/ 120.00', emoji: '🥓' },
            { name: 'Box Sommelier (Vino + 2 Quesos + Mermelada)', price: 'S/ 290.00', emoji: '🎁' },
          ]
        }
      },
      {
        id: 'bg-cta', type: 'cta',
        settings: { accentColor: '#d97706', paddingY: 80 },
        content: {
          title: 'HAMPERS & REGALOS CORPORATIVOS',
          description: 'Personalizamos tus cajas de regalo con grabado de marca y tarjeta personalizada.',
          buttonText: 'Cotizar con Sommelier',
        }
      },
      {
        id: 'bg-footer', type: 'footer',
        settings: { backgroundColor: '#0c0a09', textColor: '#fef3c7', paddingY: 48 },
        content: {
          brandName: 'BOUTIQUE GOURMET PERÚ',
          copyright: '© 2026 Boutique Gourmet.',
        }
      }
    ]
  }
];
