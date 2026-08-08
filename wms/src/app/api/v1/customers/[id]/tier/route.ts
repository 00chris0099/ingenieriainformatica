import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';

interface Props { params: Promise<{ id: string }> }

function computeTier(deliveredCount: number, cancelledCount: number, returnedCount: number, totalSpent: number): string {
  if (cancelledCount > 0 && deliveredCount === 0) return 'problematico';
  if (deliveredCount === 0) return 'nuevo';
  if (deliveredCount >= 5 || totalSpent >= 2000) return 'vip';
  if (deliveredCount >= 1) return 'frecuente';
  return 'normal';
}

export async function POST(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return apiError('Customer not found', 404);

    const orders = await prisma.order.findMany({
      where: { customerId: id },
      select: { status: true, total: true },
    });

    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
    const returnedCount = orders.filter(o => o.status === 'returned').length;
    const totalSpent = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + Number(o.total), 0);

    const tier = computeTier(deliveredCount, cancelledCount, returnedCount, totalSpent);

    const updated = await prisma.customer.update({
      where: { id },
      data: { customerTier: tier },
    });

    await invalidateCache('customers:*');

    return apiSuccess({
      id: updated.id,
      fullName: updated.fullName,
      customerTier: tier,
      stats: { deliveredCount, cancelledCount, returnedCount, totalSpent },
    });
  } catch (error) {
    return handleApiError(error, 'customer-tier');
  }
}
