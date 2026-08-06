import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/api'
import { generatePage } from '@repo/ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessName, businessDescription, industry, pageType, language, tone, templateId, specificBlocks } = body

    if (!businessName) return apiError('businessName is required', 400)
    if (!businessDescription) return apiError('businessDescription is required', 400)
    if (!industry) return apiError('industry is required', 400)

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return apiError('AI API key not configured. Set OPENAI_API_KEY environment variable.', 500)

    const result = await generatePage({
      businessName,
      businessDescription,
      industry,
      pageType: pageType || 'landing',
      language: language || 'es',
      tone: tone || 'professional',
      templateId,
      specificBlocks,
    })

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error, 'ai-generate-page')
  }
}
