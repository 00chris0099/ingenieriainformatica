import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

interface Props { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const notification = await prisma.notificationQueue.findUnique({ where: { id: params.id } });
    if (!notification) return apiError('Notification not found', 404);
    const updated = await prisma.notificationQueue.update({
      where: { id: params.id },
      data: { isRead: true },
    });
    return apiSuccess(updated);
  } catch (error) { return handleApiError(error, 'notification-read'); }
}
