import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiSuccess, parsePagination, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    // Goods receipts are not in the unified schema yet
    // Return empty list for now
    return apiPaginated([], 0, page, limit);
  } catch (error) { return handleApiError(error, 'goods-receipts-list'); }
}
