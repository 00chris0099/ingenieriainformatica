import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/api'
import { callAI } from '@/lib/ai-runtime'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessName, businessDescription, pageContent, industry, targetKeywords, language } = body

    if (!businessName) return apiError('businessName is required', 400)
    if (!businessDescription) return apiError('businessDescription is required', 400)
    if (!pageContent) return apiError('pageContent is required', 400)

    const keywords = targetKeywords?.length
      ? `Palabras clave objetivo: ${targetKeywords.join(', ')}`
      : 'Genera 8-10 keywords long-tail relevantes (incluyendo ubicación si aplica)'

    const systemPrompt = `Eres un experto en SEO técnico y GEO (Generative Engine Optimization) en español.
Generas metadata optimizada para posicionar en buscadores tradicionales (Google) y en motores de IA (SearchGPT, Gemini, Perplexity, Copilot).
Responde SOLO con JSON válido, sin texto adicional.`

    const userPrompt = `Genera la optimización SEO/GEO para la página de "${businessName}".

CONTEXTO:
- Descripción: ${businessDescription}
- Industria: ${industry || 'general'}
- Contenido de la página (primeros 1200 chars): ${pageContent.substring(0, 1200)}
- ${keywords}

Reglas:
1. metaTitle: máx 60 caracteres, con keyword principal + marca.
2. metaDescription: máx 160 caracteres, persuasiva con CTA.
3. keywords: 8-10 long-tail (p.ej. "comprar [x] en Lima").
4. Idioma: ${language || 'es'}.

Formato JSON EXACTO:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "keywords": ["k1", "k2"],
  "suggestions": ["Sugerencia SEO 1", "Sugerencia GEO 2"]
}`

    const result = await callAI(systemPrompt, userPrompt, { json: true, temperature: 0.5 })

    if (!result?.content) {
      return apiError('No se pudo generar SEO: ningún proveedor de IA configurado o todas las llamadas fallaron. Configura una API key en Configuración → IA.', 500)
    }

    try {
      const cleaned = result.content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      const parsed = JSON.parse(cleaned)
      return apiSuccess({
        provider: result.provider,
        model: result.model,
        metaTitle: (parsed.metaTitle || '').substring(0, 60),
        metaDescription: (parsed.metaDescription || '').substring(0, 160),
        keywords: parsed.keywords || [],
        suggestions: parsed.suggestions || [],
      })
    } catch (e) {
      return apiSuccess({
        provider: result.provider,
        model: result.model,
        metaTitle: businessName.substring(0, 60),
        metaDescription: businessDescription.substring(0, 160),
        keywords: targetKeywords || [],
        suggestions: [],
      })
    }
  } catch (error) {
    return handleApiError(error, 'ai-generate-seo')
  }
}
