import { aiService } from '../service'
import { buildSEOPrompt } from '../prompts/seo'
import { GenerateSEORequest, GenerateSEResponse } from '../types'

export async function generateSEO(
  request: GenerateSEORequest,
  providerId?: string
): Promise<GenerateSEResponse> {
  const prompt = buildSEOPrompt(request)

  const response = await aiService.completeWithRetry(
    {
      messages: [
        { role: 'system', content: 'Eres un experto en SEO y copywriting. Responde siempre en JSON valido.' },
        { role: 'user', content: prompt },
      ],
      json: true,
      temperature: 0.6,
    },
    providerId
  )

  try {
    const parsed = JSON.parse(response.content)
    return {
      metaTitle: (parsed.metaTitle || '').substring(0, 60),
      metaDescription: (parsed.metaDescription || '').substring(0, 160),
      keywords: parsed.keywords || [],
      suggestions: parsed.suggestions || [],
    }
  } catch {
    return {
      metaTitle: request.businessName,
      metaDescription: request.businessDescription,
      keywords: request.targetKeywords || [],
      suggestions: [],
    }
  }
}
