import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiSuccess, apiError, parsePagination, getSearchParam, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = getSearchParam(searchParams, 'status');
    const { page, limit, offset } = parsePagination(searchParams);

    const where: any = {};
    if (status) where.status = status;

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
    const { recipientId, recipientEmail, subject, body: notifBody, channel, priority } = body;

    if (!notifBody) return apiError('Notification body is required', 400);

    const notification = await prisma.notificationQueue.create({
      data: {
        subject,
        body: notifBody,
        status: 'pending',
      },
    });

    return apiSuccess(notification, 201);
  } catch (error) {
    return handleApiError(error, 'notifications-create');
  }
}
