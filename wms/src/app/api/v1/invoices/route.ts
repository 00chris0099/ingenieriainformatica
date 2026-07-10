import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = getSearchParam(searchParams, 'status');
    const { page, limit, offset } = parsePagination(searchParams);

    const result = await cached(`invoices:${page}:${limit}:${status}`, () =>
      prisma.invoice.findMany({
        where: status ? { status: status as any } : {},
        include: { customer: true, order: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }).then(async (invoices) => ({
        invoices,
        total: await prisma.invoice.count({ where: status ? { status: status as any } : {} }),
      })),
      30
    );

    const mapped = result.invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer.fullName,
      orderNumber: inv.order?.orderNumber || null,
      status: inv.status,
      currency: inv.currency,
      subtotal: Number(inv.subtotal),
      taxAmount: Number(inv.taxAmount),
      total: Number(inv.total),
      amountPaid: Number(inv.amountPaid),
      dueDate: inv.dueDate,
      paidAt: inv.paidAt,
      createdAt: inv.createdAt,
    }));

    return apiPaginated(mapped, result.total, page, limit);
  } catch (error) {
    return handleApiError(error, 'invoices-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, orderId, items, taxAmount, dueDate, notes } = body;

    if (!customerId || !items?.length) return apiError('customerId and items are required', 400);

    const subtotal = items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
    const total = subtotal + (taxAmount || 0);

    const count = await prisma.invoice.count();
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceNumber = `FAC-${dateStr}-${String(count + 1).padStart(5, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        orderId: orderId || null,
        status: 'draft',
        currency: 'PEN',
        subtotal,
        taxAmount: taxAmount || 0,
        total,
        amountPaid: 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    await invalidateCache('invoices:*');

    return apiSuccess(invoice, 201);
  } catch (error) {
    return handleApiError(error, 'invoices-create');
  }
}
