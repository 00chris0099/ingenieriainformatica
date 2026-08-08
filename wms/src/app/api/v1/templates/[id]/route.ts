import { NextRequest } from 'next/server'
import { templateRegistry } from '@repo/templates'
import { apiSuccess, apiError, handleApiError } from '@/lib/api'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const template = templateRegistry.get(id)
    if (!template) return apiError('Template not found', 404)
    return apiSuccess(template)
  } catch (error) {
    return handleApiError(error, 'template-get')
  }
}
