import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';

interface Props {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const versions = await prisma.pageVersion.findMany({
      where: { pageId: params.id },
      orderBy: { version: 'desc' },
      take: 50,
    });

    return apiSuccess(versions);
  } catch (error) {
    return handleApiError(error, 'page-versions-list');
  }
}
