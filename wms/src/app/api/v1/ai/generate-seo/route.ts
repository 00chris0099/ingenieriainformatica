import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/api'
import { generateSEO } from '@repo/ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessName, businessDescription, pageContent, industry, targetKeywords, language } = body

    if (!businessName) return apiError('businessName is required', 400)
    if (!businessDescription) return apiError('businessDescription is required', 400)
    if (!pageContent) return apiError('pageContent is required', 400)

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return apiError('AI API key not configured. Set OPENAI_API_KEY environment variable.', 500)

    const result = await generateSEO({
      businessName,
      businessDescription,
      pageContent,
      industry: industry || 'general',
      targetKeywords,
      language: language || 'es',
    })

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error, 'ai-generate-seo')
  }
}
