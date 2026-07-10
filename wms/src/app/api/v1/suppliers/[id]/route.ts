import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

interface Props { params: { id: string } }

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const supplier = await prisma.supplier.findUnique({ where: { id: params.id } });
    if (!supplier) return apiError('Supplier not found', 404);
    return apiSuccess(supplier);
  } catch (error) { return handleApiError(error, 'supplier-detail'); }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const body = await request.json();
    const { name, code, supplierType, contactName, email, phone, country, currency, rating, isActive } = body;
    const existing = await prisma.supplier.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Supplier not found', 404);

    const updated = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(supplierType !== undefined && { supplierType }),
        ...(contactName !== undefined && { contactName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(country !== undefined && { country }),
        ...(currency !== undefined && { currency }),
        ...(rating !== undefined && { rating }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    await invalidateCache('suppliers:*');
    return apiSuccess(updated);
  } catch (error) { return handleApiError(error, 'supplier-update'); }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const existing = await prisma.supplier.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Supplier not found', 404);
    await prisma.supplier.update({ where: { id: params.id }, data: { isActive: false } });
    await invalidateCache('suppliers:*');
    return apiSuccess({ message: 'Supplier deactivated' });
  } catch (error) { return handleApiError(error, 'supplier-delete'); }
}
