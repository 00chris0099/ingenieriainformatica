import { aiService } from '../service'
import { buildPageGenerationPrompt } from '../prompts/page-generation'
import { GeneratePageRequest, GeneratePageResponse } from '../types'
import { Block } from '@repo/blocks'

export async function generatePage(
  request: GeneratePageRequest,
  providerId?: string
): Promise<GeneratePageResponse> {
  const prompt = buildPageGenerationPrompt(request)

  const response = await aiService.completeWithRetry(
    {
      messages: [
        { role: 'system', content: 'Eres un experto en diseno web y landing pages. Responde siempre en JSON valido con la estructura exacta solicitada.' },
        { role: 'user', content: prompt },
      ],
      json: true,
      temperature: 0.7,
    },
    providerId
  )

  try {
    const parsed = JSON.parse(response.content)

    const blocks: Block[] = (parsed.blocks || []).map((b: any, index: number) => ({
      id: `ai-block-${index}-${Date.now()}`,
      type: b.type || 'text',
      settings: b.settings || {},
      content: b.content || {},
    }))

    return {
      blocks,
      seo: parsed.seo || {},
    }
  } catch {
    return {
      blocks: [],
      seo: {
        metaTitle: request.businessName,
        metaDescription: request.businessDescription,
      },
    }
  }
}
