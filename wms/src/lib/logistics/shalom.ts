// Shalom Logistics API Integration
// Docs: https://shalom.com.pe/api

const SHALOM_API_URL = process.env.SHALOM_API_URL || 'https://api.shalom.com.pe/v1';
const SHALOM_API_KEY = process.env.SHALOM_API_KEY;
const SHALOM_API_SECRET = process.env.SHALOM_API_SECRET;

export interface ShalomShipmentParams {
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
  codAmount?: number;
  reference?: string;
}

export interface ShalomShipmentResult {
  success: boolean;
  guideNumber?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  error?: string;
  rawData?: any;
}

async function shalomRequest(endpoint: string, method: string, body?: any): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (SHALOM_API_KEY) headers['Authorization'] = `Bearer ${SHALOM_API_KEY}`;
  if (SHALOM_API_SECRET) headers['X-API-Key'] = SHALOM_API_SECRET;

  const response = await fetch(`${SHALOM_API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || `Shalom API error: ${response.status}`);
  }
  return data;
}

export async function createShipment(params: ShalomShipmentParams): Promise<ShalomShipmentResult> {
  if (!SHALOM_API_KEY) {
    return {
      success: false,
      error: 'Shalom API key not configured. Register at shalom.com.pe/empresas',
    };
  }

  try {
    const payload = {
      numero Orden: params.orderNumber,
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
      paquetes: [{
        peso: params.weight,
        largo: 30,
        ancho: 30,
        alto: 30,
        valorDeclarado: params.declaredValue,
        contenido: params.description,
      }],
      servicio: 'estandar',
      cobrarAlDestinatario: params.codAmount ? true : false,
      montoCobrar: params.codAmount || 0,
      referencia: params.reference || '',
    };

    const result = await shalomRequest('/envios', 'POST', payload);

    return {
      success: true,
      guideNumber: result.data?.numeroGuia || result.guideNumber,
      trackingNumber: result.data?.trackingNumber || result.trackingNumber,
      carrier: 'Shalom',
      estimatedDelivery: result.data?.fechaEstimada,
      rawData: result,
    };
  } catch (error: any) {
    console.error('[Shalom] Create shipment error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function trackShipment(trackingNumber: string): Promise<{ status: string; location?: string; lastUpdate?: string }> {
  if (!SHALOM_API_KEY) {
    return { status: 'unknown' };
  }

  try {
    const result = await shalomRequest(`/envios/${trackingNumber}/tracking`, 'GET');
    return {
      status: result.data?.estado || result.status || 'unknown',
      location: result.data?.ubicacion || result.location,
      lastUpdate: result.data?.fechaActualizacion || result.lastUpdate,
    };
  } catch {
    return { status: 'error' };
  }
}

export async function cancelShipment(guideNumber: string): Promise<{ success: boolean; error?: string }> {
  if (!SHALOM_API_KEY) {
    return { success: false, error: 'Shalom API key not configured' };
  }

  try {
    await shalomRequest(`/envios/${guideNumber}/cancelar`, 'POST');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAvailableServices(): Promise<any[]> {
  if (!SHALOM_API_KEY) return [];
  try {
    const result = await shalomRequest('/servicios', 'GET');
    return result.data || [];
  } catch { return []; }
}

export function isConfigured(): boolean {
  return !!SHALOM_API_KEY;
}
