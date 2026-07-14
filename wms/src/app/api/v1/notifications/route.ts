import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiSuccess, apiError, parsePagination, getSearchParam, handleApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = getSearchParam(searchParams, 'status');
    const type = getSearchParam(searchParams, 'type');
    const unread = searchParams.get('unread');
    const after = searchParams.get('after');
    const { page, limit, offset } = parsePagination(searchParams);

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (unread === 'true') where.isRead = false;
    if (after) where.createdAt = { gt: new Date(after) };

    const [notifications, total] = await Promise.all([
      prisma.notificationQueue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.notificationQueue.count({ where }),
    ]);

    return apiPaginated(notifications, total, page, limit);
  } catch (error) {
    return handleApiError(error, 'notifications-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, body: notifBody, type } = body;

    if (!notifBody) return apiError('Notification body is required', 400);

    const notification = await prisma.notificationQueue.create({
      data: {
        subject,
        body: notifBody,
        type: type || 'info',
        status: 'pending',
      },
    });

    return apiSuccess(notification, 201);
  } catch (error) {
    return handleApiError(error, 'notifications-create');
  }
}
