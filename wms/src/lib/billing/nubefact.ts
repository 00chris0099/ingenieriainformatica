const NUBEFACT_TOKEN = process.env.NUBEFACT_TOKEN;
const NUBEFACT_URL = process.env.NUBEFACT_URL || 'https://demo.nubefact.com/api/v1';

export interface NubefactDocument {
  tipo_de_comprobante: number;
  serie: string;
  numero: number;
  fecha_de_emision: string;
  hora_de_emision: string;
 潮o_de_documento_del_cliente: string;
  tipo_de_documento_del_cliente: number;
  numero_de_documento_del_cliente: string;
  razon_social_del_cliente: string;
  codigo_de_producto: string;
  descripcion: string;
  cantidad: number;
  unidad_de_medida: string;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  tipo_de_igv: number;
  igv: number;
  total: number;
  valor_de_venta: number;
  observations?: string;
}

export interface NubefactResponse {
  errors?: string[];
  success?: boolean;
  cdr?: string;
  cdr_description?: string;
  cdr_response_code?: string;
  document_id?: string;
  document_type?: number;
  series?: string;
  number?: number;
  pdf_url?: string;
  xml_url?: string;
  cdr_url?: string;
}

export function isConfigured(): boolean {
  return !!(NUBEFACT_TOKEN && NUBEFACT_URL);
}

async function nubefactRequest(endpoint: string, data: any): Promise<NubefactResponse> {
  if (!isConfigured()) {
    return { errors: ['Nubefact no configurado. Configurar NUBEFACT_TOKEN y NUBEFACT_URL'] };
  }

  try {
    const response = await fetch(`${NUBEFACT_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NUBEFACT_TOKEN}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { errors: [`HTTP ${response.status}: ${errorText}`] };
    }

    return await response.json();
  } catch (error: any) {
    return { errors: [`Network error: ${error.message}`] };
  }
}

export async function createInvoice(data: {
  customerDocType: number;
  customerDocNumber: string;
  customerName: string;
  items: Array<{
    code: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  documentType: '01' | '03' | '07' | '08';
  serie: string;
  observation?: string;
}): Promise<NubefactResponse> {
  const now = new Date();
  const items = data.items.map((item, index) => ({
    codigo: item.code,
    descripcion: item.description,
    cantidad: item.quantity,
    unidad_de_medida: 'NIU',
    precio_unitario: item.unitPrice,
    descuento: item.discount || 0,
    tipo_de_igv: 1,
  }));

  const totalValue = items.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad - (item.descuento || 0)), 0);
  const totalIgv = totalValue * 0.18;
  const total = totalValue + totalIgv;

  const document = {
    tipo_de_comprobante: parseInt(data.documentType),
    serie: data.serie,
    numero: 0,
    fecha_de_emision: now.toISOString().split('T')[0],
   潮o_de_emision: now.toTimeString().split(' ')[0],
   潮o_de_documento_del_cliente: data.customerDocNumber,
    tipo_de_documento_del_cliente: data.customerDocType,
    numero_de_documento_del_cliente: data.customerDocNumber,
    razon_social_del_cliente: data.customerName,
    items,
    subtotal: totalValue,
    igv: totalIgv,
    total: total,
    valor_de_venta: totalValue,
    observations: data.observation || '',
  };

  return nubefactRequest('/document', document);
}

export async function getDocumentStatus(documentId: string): Promise<NubefactResponse> {
  return nubefactRequest(`/document/${documentId}/status`, {});
}

export async function getDocumentPdf(documentId: string): Promise<NubefactResponse> {
  return nubefactRequest(`/document/${documentId}/pdf`, {});
}

export async function getDocumentXml(documentId: string): Promise<NubefactResponse> {
  return nubefactRequest(`/document/${documentId}/xml`, {});
}

export async function cancelDocument(documentId: string, justification: string): Promise<NubefactResponse> {
  return nubefactRequest(`/document/${documentId}/cancel`, { justification });
}
