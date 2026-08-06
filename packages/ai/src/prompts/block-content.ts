import { GenerateBlockContentRequest } from '../types'

const toneMap: Record<string, string> = {
  professional: 'formal y profesional',
  casual: 'casual y cercano',
  friendly: 'amigable y acogedor',
  luxury: 'elegante y sofisticado',
  playful: 'divertido y creativo',
}

const languageMap: Record<string, string> = {
  es: 'español',
  en: 'inglés',
  pt: 'portugués',
}

export function buildBlockContentPrompt(request: GenerateBlockContentRequest): string {
  const tone = toneMap[request.tone || 'professional']
  const language = languageMap[request.language || 'es'] || 'español'

  const context = [
    request.businessName && `Nombre del negocio: ${request.businessName}`,
    request.businessDescription && `Descripción: ${request.businessDescription}`,
    request.industry && `Industria: ${request.industry}`,
    request.additionalContext && `Contexto adicional: ${request.additionalContext}`,
  ].filter(Boolean).join('\n')

  return `Eres un experto en copywriting y diseño web. Genera contenido para un bloque de tipo "${request.blockType}" en una página web.

CONTEXTO:
${context || 'Sin contexto específico'}

INSTRUCCIONES:
- Idioma: ${language}
- Tono: ${tone}
- El contenido debe ser atractivo, profesional y estar optimizado para conversión
- Genera texto real, no lorem ipsum
- El contenido debe ser relevante para la industria mencionada

RESPONDE EN JSON con esta estructura exacta:
{
  "content": {
    "title": "Título principal del bloque",
    "subtitle": "Subtítulo descriptivo (si aplica)",
    "buttonText": "Texto del botón CTA (si aplica)",
    "items": [
      { "title": "Item 1", "description": "Descripción del item 1" }
    ]
  },
  "suggestions": ["Sugerencia 1", "Sugerencia 2"]
}

Solo incluye las propiedades que apliquen al tipo de bloque "${request.blockType}".`
}

export const blockTypeDescriptions: Record<string, string> = {
  hero: 'Banner principal con título, subtítulo y botones de llamada a la acción',
  features: 'Grid de características o beneficios del negocio',
  cta: 'Sección de llamada a la acción para_convertir visitantes',
  testimonials: 'Testimonios y reseñas de clientes',
  faq: 'Preguntas frecuentes respondidas',
  footer: 'Pie de página con información de la empresa',
  'product-grid': 'Grid de productos destacados',
  pricing: 'Tabla de precios con planes y features',
  newsletter: 'Formulario de suscripción al newsletter',
  text: 'Bloque de texto con título y contenido',
  image: 'Imagen con caption opcional',
  gallery: 'Galería de imágenes',
  columns: 'Contenido en columnas múltiples',
  countdown: 'Temporizador de cuenta regresiva para ofertas',
  contact: 'Formulario de contacto con mapa',
  'social-proof': 'Prueba social (logos de clientes, estadísticas)',
  accordion: 'Contenido desplegable en acordeón',
}
