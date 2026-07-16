import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';
import { createInvoice, isConfigured } from '@/lib/billing/nubefact';
import { calcularIGVPorItem } from '@/lib/billing/igv';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = getSearchParam(searchParams, 'status');
    const type = getSearchParam(searchParams, 'type');
    const { page, limit, offset } = parsePagination(searchParams);

    const where: any = {};
    if (status) where.status = status;
    if (type) where.documentType = type;

    const result = await cached(`invoices:${page}:${limit}:${status}:${type}`, () =>
      prisma.invoice.findMany({
        where,
        include: { customer: true, order: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }).then(async (invoices) => ({
        invoices,
        total: await prisma.invoice.count({ where }),
      })),
      30
    );

    const mapped = result.invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      documentType: inv.documentType || 'FACTURA',
      customerName: inv.customer?.fullName || 'Sin cliente',
      customerDoc: inv.customer?.documentNumber || '',
      orderNumber: inv.order?.orderNumber || null,
      status: inv.status,
      currency: inv.currency,
      subtotal: Number(inv.subtotal),
      taxAmount: Number(inv.taxAmount),
      total: Number(inv.total),
      amountPaid: Number(inv.amountPaid),
      nubefactId: (inv as any).nubefactId || null,
      pdfUrl: (inv as any).pdfUrl || null,
      xmlUrl: (inv as any).xmlUrl || null,
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
    const { customerId, orderId, documentType, items, notes } = body;

    if (!items?.length) return apiError('items are required', 400);

    const customer = customerId ? await prisma.customer.findUnique({ where: { id: customerId } }) : null;

    const igvCalc = calcularIGVPorItem(items);

    const count = await prisma.invoice.count();
    const now = new Date();
    const year = now.getFullYear();
    const consecutive = String(count + 1).padStart(8, '0');
    const invoiceNumber = `${documentType === 'BOLETA' ? 'B001' : 'F001'}-${consecutive}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        documentType: documentType || 'FACTURA',
        customerId: customerId || null,
        orderId: orderId || null,
        status: 'draft',
        currency: 'PEN',
        subtotal: igvCalc.baseImponible,
        taxAmount: igvCalc.igv,
        total: igvCalc.total,
        amountPaid: 0,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            description: item.description || item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            total: item.unitPrice * item.quantity - (item.discount || 0),
          })),
        },
      },
      include: { items: true, customer: true },
    });

    await invalidateCache('invoices:*');

    return apiSuccess(invoice, 201);
  } catch (error) {
    return handleApiError(error, 'invoices-create');
  }
}
