import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const body = await request.json();
    const { pageId, name, variants, trafficSplit } = body;

    if (!pageId || !name || !variants || variants.length < 2) {
      return apiError('pageId, name, and at least 2 variants required', 400);
    }

    const existing = await prisma.settings.findUnique({ where: { key: `ab_test_${pageId}_${name}` } });
    if (existing) return apiError('A/B test already exists for this page and name', 409);

    const split = trafficSplit || variants.map(() => 100 / variants.length);

    const testConfig: Record<string, any> = {
      name,
      pageId,
      variants,
      trafficSplit: split,
      status: 'draft',
      createdAt: new Date().toISOString(),
      results: {},
    };

    for (const v of variants) {
      testConfig.results[v] = { views: 0, conversions: 0 };
    }

    await prisma.settings.create({
      data: { key: `ab_test_${pageId}_${name}`, value: testConfig },
    });

    return apiSuccess(testConfig, 201);
  } catch (error) {
    return handleApiError(error, 'ab-test-create');
  }
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) return apiError('pageId required', 400);

    const allSettings = await prisma.settings.findMany({
      where: { key: { startsWith: `ab_test_${pageId}_` } },
    });

    const tests = allSettings.map(s => s.value);
    return apiSuccess(tests);
  } catch (error) {
    return handleApiError(error, 'ab-test-list');
  }
}
