// SUNAT REST API - Consulta de RUC
// API Publica (no requiere certificado)
// Docs: https://api.sunat.gob.pe/

const SUNAT_API_BASE = 'https://api.sunat.gob.pe/v1/contribuyentes';

export interface SunatRucData {
  success: boolean;
  data?: {
    ruc: string;
    razonSocial: string;
    nombreComercial: string;
    estado: string;
    condicion: string;
    direccion: string;
    distrito: string;
    provincia: string;
    departamento: string;
    emisorElectronico: boolean;
    fechaInscripcion: string;
  };
  error?: string;
}

export async function consultarRuc(ruc: string): Promise<SunatRucData> {
  // Validate RUC format (11 digits)
  if (!/^\d{11}$/.test(ruc)) {
    return { success: false, error: 'RUC debe tener 11 digitos' };
  }

  try {
    // Using the public SUNAT API
    const response = await fetch(`${SUNAT_API_BASE}/?nuRuc=${ruc}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // If the primary API fails, try alternative
      return await consultarRucAlternativa(ruc);
    }

    const result = await response.json();

    if (result?.data) {
      return {
        success: true,
        data: {
          ruc: result.data.nuRuc || ruc,
          razonSocial: result.data.desNomIntegration || result.data.desNomContribuyente || '',
          nombreComercial: result.data.desNomIntegration || '',
          estado: result.data.desEstadoContribuyente || 'ACTIVO',
          condicion: result.data.desCondicionContribuyente || 'HABIDO',
          direccion: result.data.desDireccion || '',
          distrito: result.data.desDistrito || '',
          provincia: result.data.desProvincia || '',
          departamento: result.data.desDepartamento || '',
          emisorElectronico: result.data.indFacturacionElectronica === 'S',
          fechaInscripcion: result.data.fecFechaActivacion || '',
        },
      };
    }

    return { success: false, error: 'No se encontraron datos para este RUC' };
  } catch (error) {
    console.error('[SUNAT] Error consultando RUC:', error);
    return await consultarRucAlternativa(ruc);
  }
}

// Alternative method using a free RUC lookup service
async function consultarRucAlternativa(ruc: string): Promise<SunatRucData> {
  try {
    // Using a free public endpoint
    const response = await fetch(`https://dniruc.apiperu.pe/api/ruc/${ruc}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, error: 'No se pudo consultar el RUC' };
    }

    const result = await response.json();

    if (result.success && result.data) {
      return {
        success: true,
        data: {
          ruc: result.data.ruc || ruc,
          razonSocial: result.data.nombre || '',
          nombreComercial: result.data.nombre || '',
          estado: result.data.estado || 'ACTIVO',
          condicion: result.data.condicion || 'HABIDO',
          direccion: result.data.direccion || '',
          distrito: result.data.distrito || '',
          provincia: result.data.provincia || '',
          departamento: result.data.departamento || '',
          emisorElectronico: result.data.emisorElectronico || false,
          fechaInscripcion: result.data.fechaInscripcion || '',
        },
      };
    }

    return { success: false, error: result.message || 'RUC no encontrado' };
  } catch (error) {
    console.error('[SUNAT] Alternative API error:', error);
    return { success: false, error: 'Error al consultar RUC' };
  }
}

// Validate RUC checksum (basic validation)
export function isValidRuc(ruc: string): boolean {
  if (!/^\d{11}$/.test(ruc)) return false;

  // Basic checksum validation for Peruvian RUC
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(ruc[i]) * weights[i];
  }
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? remainder : 11 - remainder;
  return checkDigit === parseInt(ruc[10]);
}
