import { NextRequest } from 'next/server'
import { prisma } from '@repo/prisma'
import { apiSuccess, apiError, handleApiError } from '@/lib/api'
import { requireAuth } from '@/lib/api/auth-guard'

const DEFAULT_BUSINESS_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const authCheck = await requireAuth()
    if (authCheck.error) return authCheck.error

    let business = await prisma.business.findUnique({ where: { id: DEFAULT_BUSINESS_ID } })

    if (!business) {
      business = await prisma.business.create({
        data: {
          id: DEFAULT_BUSINESS_ID,
          name: 'Mi Negocio',
          slug: 'mi-negocio',
          industry: 'ecommerce',
          subdomain: 'mi-negocio',
          primaryColor: '#2563eb',
          secondaryColor: '#7c3aed',
          accentColor: '#f59e0b',
        },
      })
    }

    return apiSuccess(business)
  } catch (error) {
    return handleApiError(error, 'business-get')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAuth()
    if (authCheck.error) return authCheck.error

    const userRole = (authCheck.user as any).role
    if (!['super_admin', 'admin'].includes(userRole)) {
      return apiError('Admin access required', 403)
    }

    const body = await request.json()
    const { name, slug, industry, logoUrl, faviconUrl, primaryColor, secondaryColor, accentColor, domain, subdomain, settings } = body

    const existing = await prisma.business.findUnique({ where: { id: DEFAULT_BUSINESS_ID } })
    if (!existing) return apiError('Business not found', 404)

    const data: any = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (industry !== undefined) data.industry = industry
    if (logoUrl !== undefined) data.logoUrl = logoUrl
    if (faviconUrl !== undefined) data.faviconUrl = faviconUrl
    if (primaryColor !== undefined) data.primaryColor = primaryColor
    if (secondaryColor !== undefined) data.secondaryColor = secondaryColor
    if (accentColor !== undefined) data.accentColor = accentColor
    if (domain !== undefined) data.domain = domain || null
    if (subdomain !== undefined) data.subdomain = subdomain
    if (settings !== undefined) data.settings = settings

    const updated = await prisma.business.update({ where: { id: DEFAULT_BUSINESS_ID }, data })
    return apiSuccess(updated)
  } catch (error) {
    return handleApiError(error, 'business-update')
  }
}
