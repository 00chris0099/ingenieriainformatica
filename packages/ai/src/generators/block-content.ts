import { aiService } from '../service'
import { buildBlockContentPrompt, blockTypeDescriptions } from '../prompts/block-content'
import { GenerateBlockContentRequest, GenerateBlockContentResponse } from '../types'

export async function generateBlockContent(
  request: GenerateBlockContentRequest,
  providerId?: string
): Promise<GenerateBlockContentResponse> {
  const prompt = buildBlockContentPrompt(request)

  const response = await aiService.completeWithRetry(
    {
      messages: [
        { role: 'system', content: 'Eres un experto en copywriting web. Responde siempre en JSON valido.' },
        { role: 'user', content: prompt },
      ],
      json: true,
      temperature: 0.7,
    },
    providerId
  )

  try {
    const parsed = JSON.parse(response.content)
    return {
      content: parsed.content || {},
      suggestions: parsed.suggestions || [],
    }
  } catch {
    return {
      content: { title: response.content.substring(0, 100) },
      suggestions: [],
    }
  }
}

export async function generateMultipleBlocks(
  blockTypes: string[],
  request: Omit<GenerateBlockContentRequest, 'blockType'>,
  providerId?: string
): Promise<Record<string, GenerateBlockContentResponse>> {
  const results: Record<string, GenerateBlockContentResponse> = {}

  const batchRequests = blockTypes.map(blockType => {
    const prompt = buildBlockContentPrompt({ ...request, blockType })
    return {
      request: {
        messages: [
          { role: 'system' as const, content: 'Eres un experto en copywriting web. Responde siempre en JSON valido.' },
          { role: 'user' as const, content: prompt },
        ],
        json: true,
        temperature: 0.7,
      },
      providerId,
    }
  })

  const batchResults = await aiService.completeBatch(batchRequests, 3)

  blockTypes.forEach((blockType, i) => {
    const batchResult = batchResults[i]
    if (batchResult?.success && batchResult.result) {
      try {
        const parsed = JSON.parse(batchResult.result.content)
        results[blockType] = {
          content: parsed.content || {},
          suggestions: parsed.suggestions || [],
        }
      } catch {
        results[blockType] = {
          content: { title: batchResult.result.content.substring(0, 100) },
          suggestions: [],
        }
      }
    } else {
      results[blockType] = {
        content: { title: `Contenido para ${blockType}` },
        suggestions: [],
      }
    }
  })

  return results
}

export { blockTypeDescriptions }
