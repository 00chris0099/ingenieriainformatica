// Olva Logistics API Integration
// Docs: https://docs.olva.com.pe

const OLVA_API_URL = process.env.OLVA_API_URL || 'https://api.olva.com.pe/v1';
const OLVA_API_KEY = process.env.OLVA_API_KEY;
const OLVA_API_SECRET = process.env.OLVA_API_SECRET;

export interface OlvaShipmentParams {
  orderNumber: string;
  originName: string;
  originPhone: string;
  originAddress: string;
  originCity: string;
  originDepartment: string;
  destName: string;
  destPhone: string;
  destAddress: string;
  destCity: string;
  destDepartment: string;
  destDistrict: string;
  weight: number;
  declaredValue: number;
  description: string;
  codAmount?: number; // Cash on delivery amount
  reference?: string;
}

export interface OlvaShipmentResult {
  success: boolean;
  guideNumber?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  error?: string;
  rawData?: any;
}

async function olvaRequest(endpoint: string, method: string, body?: any): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (OLVA_API_KEY) headers['Authorization'] = `Bearer ${OLVA_API_KEY}`;
  if (OLVA_API_SECRET) headers['X-API-Secret'] = OLVA_API_SECRET;

  const response = await fetch(`${OLVA_API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || `Olva API error: ${response.status}`);
  }
  return data;
}

export async function createShipment(params: OlvaShipmentParams): Promise<OlvaShipmentResult> {
  if (!OLVA_API_KEY) {
    return {
      success: false,
      error: 'Olva API key not configured. Get credentials at olva.com.pe/empresas or call 01-612-1212',
    };
  }

  try {
    const payload = {
      nroOrden: params.orderNumber,
      remitente: {
        nombre: params.originName,
        telefono: params.originPhone,
        direccion: params.originAddress,
        ciudad: params.originCity,
        departamento: params.originDepartment,
      },
      destinatario: {
        nombre: params.destName,
        telefono: params.destPhone,
        direccion: params.destAddress,
        ciudad: params.destCity,
        departamento: params.destDepartment,
        distrito: params.destDistrict,
      },
      bultos: 1,
      peso: params.weight,
      valorDeclarado: params.declaredValue,
      contenido: params.description,
      servicio: 'estandar',
      cobrarAlDestinatario: params.codAmount ? true : false,
      montoCobrar: params.codAmount || 0,
      referencia: params.reference || '',
    };

    const result = await olvaRequest('/envios', 'POST', payload);

    return {
      success: true,
      guideNumber: result.data?.nroGuia || result.guideNumber || result.nroGuia,
      trackingNumber: result.data?.trackingNumber || result.trackingNumber || result.nroGuia,
      carrier: 'Olva',
      estimatedDelivery: result.data?.fechaEstimada || result.fechaEstimada,
      rawData: result,
    };
  } catch (error: any) {
    console.error('[Olva] Create shipment error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function trackShipment(trackingNumber: string): Promise<{ status: string; location?: string; lastUpdate?: string }> {
  if (!OLVA_API_KEY) {
    return { status: 'unknown' };
  }

  try {
    const result = await olvaRequest(`/envios/${trackingNumber}/tracking`, 'GET');
    return {
      status: result.data?.estado || result.status || 'unknown',
      location: result.data?.ubicacion || result.location,
      lastUpdate: result.data?.fechaActualizacion || result.lastUpdate,
    };
  } catch (error) {
    return { status: 'error' };
  }
}

export async function cancelShipment(guideNumber: string): Promise<{ success: boolean; error?: string }> {
  if (!OLVA_API_KEY) {
    return { success: false, error: 'Olva API key not configured' };
  }

  try {
    await olvaRequest(`/envios/${guideNumber}/cancelar`, 'POST');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAvailableServices(): Promise<any[]> {
  if (!OLVA_API_KEY) {
    return [];
  }

  try {
    const result = await olvaRequest('/servicios', 'GET');
    return result.data || [];
  } catch {
    return [];
  }
}

export function isConfigured(): boolean {
  return !!OLVA_API_KEY;
}
