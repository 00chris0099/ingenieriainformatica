import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, pageSlug, referrer, userAgent } = body;

    if (!pageId && !pageSlug) return apiError('pageId or pageSlug required', 400);

    const page = pageId
      ? await prisma.page.findUnique({ where: { id: pageId } })
      : await prisma.page.findFirst({ where: { slug: pageSlug, status: 'published' } });

    if (!page) return apiError('Page not found', 404);

    const existingSettings = await prisma.settings.findUnique({ where: { key: `page_analytics_${page.id}` } });
    const analytics = (existingSettings?.value as Record<string, any>) || { views: 0, uniqueVisitors: 0, lastViewedAt: null };

    analytics.views = (analytics.views || 0) + 1;
    analytics.lastViewedAt = new Date().toISOString();
    if (!analytics.dailyViews) analytics.dailyViews = {};

    const today = new Date().toISOString().split('T')[0]!;
    analytics.dailyViews[today] = (analytics.dailyViews[today] || 0) + 1;

    // Keep only last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
    for (const key of Object.keys(analytics.dailyViews)) {
      if (key < thirtyDaysAgo) delete analytics.dailyViews[key];
    }

    await prisma.settings.upsert({
      where: { key: `page_analytics_${page.id}` },
      update: { value: analytics },
      create: { key: `page_analytics_${page.id}`, value: analytics },
    });

    return apiSuccess({ tracked: true });
  } catch (error) {
    return handleApiError(error, 'page-analytics-track');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) return apiError('pageId required', 400);

    const settings = await prisma.settings.findUnique({ where: { key: `page_analytics_${pageId}` } });
    const analytics = (settings?.value as Record<string, any>) || { views: 0, dailyViews: {} };

    return apiSuccess(analytics);
  } catch (error) {
    return handleApiError(error, 'page-analytics-get');
  }
}
