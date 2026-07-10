import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

interface Props { params: { id: string } }

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: { orders: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!customer) return apiError('Customer not found', 404);
    return apiSuccess(customer);
  } catch (error) { return handleApiError(error, 'customer-detail'); }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const body = await request.json();
    const { fullName, phone, email, isActive } = body;
    const existing = await prisma.customer.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Customer not found', 404);

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    await invalidateCache('customers:*');
    return apiSuccess(updated);
  } catch (error) { return handleApiError(error, 'customer-update'); }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const existing = await prisma.customer.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Customer not found', 404);
    await prisma.customer.update({ where: { id: params.id }, data: { isActive: false } });
    await invalidateCache('customers:*');
    return apiSuccess({ message: 'Customer deactivated' });
  } catch (error) { return handleApiError(error, 'customer-delete'); }
}
