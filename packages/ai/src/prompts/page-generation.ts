import { GeneratePageRequest } from '../types'

const toneMap: Record<string, string> = {
  professional: 'formal y profesional',
  casual: 'casual y cercano',
  friendly: 'amigable y acogedor',
  luxury: 'elegante y sofisticado',
  playful: 'divertido y creativo',
}

export function buildPageGenerationPrompt(request: GeneratePageRequest): string {
  const tone = toneMap[request.tone || 'professional']

  return `Eres un experto en diseño web y landing pages. Genera la estructura completa de una página web tipo "${request.pageType}" para un negocio.

NEGOCIO:
- Nombre: ${request.businessName}
- Descripción: ${request.businessDescription}
- Industria: ${request.industry}
- Tono: ${tone}

INSTRUCCIONES:
1. Selecciona los bloques más apropiados para esta industria y tipo de página
2. Para cada bloque, genera contenido personalizado y relevante
3. El contenido debe estar en español
4. Cada bloque debe tener contenido real, no lorem ipsum
5. Incluye configuración SEO básica

BLOQUES DISPONIBLES: hero, features, cta, testimonials, faq, footer, product-grid, pricing, newsletter, text, image, gallery, columns, countdown, contact, social-proof, accordion

RESPONDE EN JSON con esta estructura:
{
  "blocks": [
    {
      "type": "hero",
      "settings": {},
      "content": {
        "title": "Título del hero",
        "subtitle": "Subtítulo",
        "buttonText": "Texto del botón",
        "buttonLink": "#"
      }
    }
  ],
  "seo": {
    "metaTitle": "Título SEO (max 60 caracteres)",
    "metaDescription": "Descripción SEO (max 160 caracteres)",
    "keywords": ["keyword1", "keyword2"]
  }
}

Genera entre 4 y 8 bloques según la industria. Siempre incluye hero y footer.`
}
