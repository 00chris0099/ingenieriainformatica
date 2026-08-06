import { NextRequest } from 'next/server'
import { templateRegistry } from '@repo/templates'
import { apiSuccess, apiPaginated, parsePagination, getSearchParam, handleApiError } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const industry = getSearchParam(searchParams, 'industry')
    const query = getSearchParam(searchParams, 'q')
    const { page, limit } = parsePagination(searchParams)

    let templates = templateRegistry.getAll()

    if (industry) {
      templates = templates.filter(t => t.industry === industry)
    }
    if (query) {
      templates = templateRegistry.search(query)
    }

    const total = templates.length
    const offset = (page - 1) * limit
    const items = templates.slice(offset, offset + limit)

    return apiPaginated(items, total, page, limit)
  } catch (error) {
    return handleApiError(error, 'templates-list')
  }
}
