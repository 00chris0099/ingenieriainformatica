import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';
import { createInvoice, isConfigured } from '@/lib/billing/nubefact';

interface Props { params: { id: string } }

export async function POST(request: NextRequest, { params }: Props) {
  try {
    if (!isConfigured()) {
      return apiError('Nubefact no configurado. Configurar NUBEFACT_TOKEN y NUBEFACT_URL en .env.local', 400);
    }

    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id: params.id }, { invoiceNumber: params.id }] },
      include: { customer: true, items: true },
    });

    if (!invoice) return apiError('Invoice not found', 404);
    if (invoice.status !== 'draft') return apiError('Solo se pueden enviar facturas en estado borrador', 400);

    const isBoleta = invoice.invoiceNumber.startsWith('B');
    const docType = isBoleta ? '03' : '01';
    const serie = invoice.invoiceNumber.split('-')[0] || (isBoleta ? 'B001' : 'F001');

    const taxId = invoice.customer?.taxId || '';
    const customerDocType = taxId.length === 11 ? 6 : taxId.length === 8 ? 1 : 0;
    const customerDocNumber = taxId || '00000000';
    const customerName = invoice.customer?.fullName || invoice.customer?.companyName || 'CLIENTE VARIADO';

    const nubefactResult = await createInvoice({
      customerDocType,
      customerDocNumber,
      customerName,
      documentType: docType as any,
      serie,
      items: invoice.items.map((item: any) => ({
        code: item.productVariantId || '001',
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount || 0),
      })),
      observation: invoice.notes || '',
    });

    if (nubefactResult.errors?.length) {
      return apiError(`Error de Nubefact: ${nubefactResult.errors.join(', ')}`, 400);
    }

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'issued',
        ...(nubefactResult.pdf_url && { pdfUrl: nubefactResult.pdf_url } as any),
        ...(nubefactResult.xml_url && { xmlUrl: nubefactResult.xml_url } as any),
      },
    });

    await invalidateCache('invoices:*');

    return apiSuccess({
      invoice: updated,
      nubefact: {
        cdr: nubefactResult.cdr,
        cdrDescription: nubefactResult.cdr_description,
        pdfUrl: nubefactResult.pdf_url,
        xmlUrl: nubefactResult.xml_url,
      },
    });
  } catch (error) {
    return handleApiError(error, 'invoice-send');
  }
}
