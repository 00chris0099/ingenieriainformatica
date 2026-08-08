import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/api'
import { callAI } from '@/lib/ai-runtime'
import { blockTypeDescriptions } from '@repo/ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { blockType, industry, businessName, businessDescription, language, tone, additionalContext } = body

    if (!blockType) return apiError('blockType is required', 400)

    const blockDesc = blockTypeDescriptions[blockType] || 'bloque de contenido web'
    const context = [
      businessName && `Nombre del negocio: ${businessName}`,
      businessDescription && `Descripción: ${businessDescription}`,
      industry && `Industria: ${industry}`,
      additionalContext && `Contexto adicional: ${additionalContext}`,
    ].filter(Boolean).join('\n')

    const systemPrompt = `Eres un experto en copywriting y diseño web de alta conversión. Generas contenido para bloques de páginas web.
Reglas: idioma ${language || 'es'}, tono ${tone || 'professional'}, contenido real y específico (nunca lorem ipsum), cero emojis, optimizado para conversión, SEO y GEO.
Responde SOLO con JSON válido, sin texto adicional.`

    const userPrompt = `Genera el contenido para un bloque de tipo "${blockType}" (${blockDesc}).

CONTEXTO:
${context || 'Sin contexto específico'}

Formato JSON EXACTO:
{
  "content": {
    "title": "Título principal",
    "subtitle": "Subtítulo (si aplica)",
    "buttonText": "Texto del CTA (si aplica)",
    "items": [{ "title": "Item 1", "description": "Descripción del item 1" }]
  },
  "suggestions": ["Mejora 1", "Mejora 2"]
}

Incluye solo las propiedades que apliquen al bloque "${blockType}". Si el bloque es product-grid, genera products con name/price/originalPrice/discountBadge/imageUrl/sizes/description. Si es pricing, genera plans con name/price/features/highlight. Si es faq, genera items con question/answer.`

    const result = await callAI(systemPrompt, userPrompt, { json: true, temperature: 0.7 })

    if (!result?.content) {
      return apiError('No se pudo generar contenido: ningún proveedor de IA configurado o todas las llamadas fallaron. Configura una API key en Configuración → IA.', 500)
    }

    try {
      const cleaned = result.content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      const parsed = JSON.parse(cleaned)
      return apiSuccess({
        provider: result.provider,
        model: result.model,
        content: parsed.content || {},
        suggestions: parsed.suggestions || [],
      })
    } catch (e) {
      return apiSuccess({
        provider: result.provider,
        model: result.model,
        content: { title: result.content.substring(0, 120) },
        suggestions: [],
      })
    }
  } catch (error) {
    return handleApiError(error, 'ai-generate-block')
  }
}
