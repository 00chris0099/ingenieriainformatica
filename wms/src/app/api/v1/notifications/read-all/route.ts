import { prisma } from '@repo/prisma';
import { apiSuccess, handleApiError } from '@/lib/api';

export async function PATCH() {
  try {
    const result = await prisma.notificationQueue.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    return apiSuccess({ updated: result.count });
  } catch (error) {
    return handleApiError(error, 'notifications-read-all');
  }
}
