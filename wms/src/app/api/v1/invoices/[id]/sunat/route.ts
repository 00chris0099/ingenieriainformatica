import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

interface Props { params: { id: string } }

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id: params.id }, { invoiceNumber: params.id }] },
      include: { customer: true, items: true },
    });
    if (!invoice) return apiError('Invoice not found', 404);

    // TODO: Real SUNAT integration
    // const sunatResult = await sendInvoice({ ... });
    const cdrCode = '0';
    const cdrDescription = 'ACEPTADO';

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'issued' },
    });

    return apiSuccess({ cdrCode, cdrDescription, invoice: updated });
  } catch (error) { return handleApiError(error, 'sunat-send'); }
}
