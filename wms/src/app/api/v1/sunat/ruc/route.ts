import { NextRequest } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { consultarRuc, isValidRuc } from '@/lib/sunat/consulta-ruc';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ruc = searchParams.get('ruc');

    if (!ruc) return apiError('RUC parameter is required', 400);
    if (!isValidRuc(ruc)) return apiError('Invalid RUC format', 400);

    const result = await consultarRuc(ruc);

    if (!result.success) {
      return apiError(result.error || 'Could not find RUC', 404);
    }

    return apiSuccess(result.data);
  } catch (error) {
    return handleApiError(error, 'sunat-ruc-consult');
  }
}
