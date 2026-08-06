import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/api'
import { generateBlockContent } from '@repo/ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { blockType, industry, businessName, businessDescription, language, tone, additionalContext } = body

    if (!blockType) return apiError('blockType is required', 400)

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return apiError('AI API key not configured. Set OPENAI_API_KEY environment variable.', 500)

    const result = await generateBlockContent({
      blockType,
      industry,
      businessName,
      businessDescription,
      language: language || 'es',
      tone: tone || 'professional',
      additionalContext,
    })

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error, 'ai-generate-block')
  }
}
