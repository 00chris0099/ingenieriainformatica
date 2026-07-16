import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiError, handleApiError } from '@/lib/api';
import { generateInvoiceHTML, InvoicePDFData } from '@/lib/billing/pdf-generator';

interface Props { params: { id: string } }

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id: params.id }, { invoiceNumber: params.id }] },
      include: { customer: true, items: true, order: true },
    });

    if (!invoice) return apiError('Invoice not found', 404);

    const pdfData: InvoicePDFData = {
      number: invoice.invoiceNumber.split('-')[1] || invoice.invoiceNumber,
      series: invoice.invoiceNumber.split('-')[0] || 'F001',
      date: invoice.createdAt.toISOString().split('T')[0],
      customer: {
        name: invoice.customer?.fullName || 'CLIENTE VARIADO',
        docType: invoice.customer?.documentType || 'DNI',
        docNumber: invoice.customer?.documentNumber || '00000000',
        address: invoice.customer?.address || undefined,
      },
      items: invoice.items.map((item: any) => ({
        code: item.productVariantId || '001',
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount || 0),
        total: Number(item.total),
      })),
      subtotal: Number(invoice.subtotal),
      igv: Number(invoice.taxAmount),
      total: Number(invoice.total),
      observations: invoice.notes || undefined,
    };

    const html = generateInvoiceHTML(pdfData);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="factura_${invoice.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    return handleApiError(error, 'invoice-pdf');
  }
}
