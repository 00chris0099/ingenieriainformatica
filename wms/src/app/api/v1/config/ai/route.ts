import { NextRequest } from 'next/server'
import { prisma } from '@repo/prisma'
import { apiSuccess, handleApiError } from '@/lib/api'
import { requireAuth } from '@/lib/api/auth-guard'

export async function GET() {
  try {
    const authCheck = await requireAuth()
    if (authCheck.error) return authCheck.error

    const settings = await prisma.settings.findUnique({ where: { key: 'ai_config' } })
    const stored = settings?.value as Record<string, any> || {}

    const config = {
      defaultProvider: stored.defaultProvider || process.env.AI_DEFAULT_PROVIDER || 'openai',
      providers: {
        openai: {
          configured: !!process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        },
        anthropic: {
          configured: !!process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        },
      },
    }

    return apiSuccess(config)
  } catch (error) {
    return handleApiError(error, 'ai-config-get')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAuth()
    if (authCheck.error) return authCheck.error

    const userRole = (authCheck.user as any).role
    if (!['super_admin', 'admin'].includes(userRole)) {
      return apiSuccess({ success: false, error: 'Admin access required' }, 403)
    }

    const body = await request.json()
    const { defaultProvider } = body

    await prisma.settings.upsert({
      where: { key: 'ai_config' },
      update: { value: { defaultProvider: defaultProvider || 'openai' } },
      create: { key: 'ai_config', value: { defaultProvider: defaultProvider || 'openai' } },
    })

    const config = {
      defaultProvider: defaultProvider || 'openai',
      providers: {
        openai: {
          configured: !!process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        },
        anthropic: {
          configured: !!process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        },
      },
    }

    return apiSuccess(config)
  } catch (error) {
    return handleApiError(error, 'ai-config-update')
  }
}
