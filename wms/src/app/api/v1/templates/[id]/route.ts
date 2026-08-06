import { NextRequest } from 'next/server'
import { templateRegistry } from '@repo/templates'
import { apiSuccess, apiError, handleApiError } from '@/lib/api'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const template = templateRegistry.get(params.id)
    if (!template) return apiError('Template not found', 404)
    return apiSuccess(template)
  } catch (error) {
    return handleApiError(error, 'template-get')
  }
}
