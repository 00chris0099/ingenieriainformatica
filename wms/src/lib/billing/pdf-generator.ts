export interface InvoicePDFData {
  number: string;
  series: string;
  date: string;
  customer: {
    name: string;
    docType: string;
    docNumber: string;
    address?: string;
  };
  items: Array<{
    code: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }>;
  subtotal: number;
  igv: number;
  total: number;
  observations?: string;
}

export function generateInvoiceHTML(data: InvoicePDFData): string {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.code}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">S/ ${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">S/ ${item.discount.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">S/ ${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
    .invoice-container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
    .company-info h1 { color: #2563eb; font-size: 24px; margin-bottom: 5px; }
    .company-info p { color: #666; font-size: 11px; line-height: 1.4; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { color: #2563eb; font-size: 18px; }
    .invoice-title .number { font-size: 14px; color: #333; margin-top: 5px; }
    .invoice-title .date { font-size: 11px; color: #666; margin-top: 5px; }
    .customer-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .customer-info h3 { font-size: 12px; color: #666; margin-bottom: 8px; text-transform: uppercase; }
    .customer-info p { font-size: 12px; margin-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #2563eb; color: white; padding: 10px 8px; text-align: left; font-size: 11px; }
    th:nth-child(3), th:nth-child(4), th:nth-child(5), th:nth-child(6) { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-top: 20px; }
    .totals-box { width: 250px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .totals-row.total { font-weight: bold; font-size: 14px; border-bottom: 2px solid #2563eb; color: #2563eb; }
    .observations { margin-top: 20px; padding: 10px; background: #fffbeb; border-radius: 8px; font-size: 11px; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <h1>ADRISU KIDS</h1>
        <p>RUC: 10730431746</p>
        <p>Av. Industrial 123, Lima - Lima</p>
        <p>Tel: 999111222</p>
      </div>
      <div class="invoice-title">
        <h2>${data.series === 'F001' ? 'FACTURA ELECTRONICA' : 'BOLETA DE VENTA'}</h2>
        <div class="number">${data.series}-${data.number}</div>
        <div class="date">Fecha: ${data.date}</div>
      </div>
    </div>

    <div class="customer-info">
      <h3>Cliente</h3>
      <p><strong>${data.customer.docType}:</strong> ${data.customer.docNumber}</p>
      <p><strong>Razon Social:</strong> ${data.customer.name}</p>
      ${data.customer.address ? `<p><strong>Direccion:</strong> ${data.customer.address}</p>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>Codigo</th>
          <th>Descripcion</th>
          <th>Cant.</th>
          <th>Precio Unit.</th>
          <th>Descuento</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>S/ ${data.subtotal.toFixed(2)}</span>
        </div>
        <div class="totals-row">
          <span>IGV (18%):</span>
          <span>S/ ${data.igv.toFixed(2)}</span>
        </div>
        <div class="totals-row total">
          <span>TOTAL:</span>
          <span>S/ ${data.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    ${data.observations ? `<div class="observations"><strong>Observaciones:</strong> ${data.observations}</div>` : ''}

    <div class="footer">
      <p>Documento generado electronicamente via Nubefact</p>
      <p>ADRISU KIDS - Muebles para bebes</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
