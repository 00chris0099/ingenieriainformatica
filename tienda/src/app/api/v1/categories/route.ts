import { prisma } from '@repo/prisma';
import { apiSuccess, handleApiError } from '@/lib/api';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: { _count: { select: { products: true } }, children: { where: { isActive: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return apiSuccess(categories);
  } catch (error) { return handleApiError(error, 'store-categories'); }
}
