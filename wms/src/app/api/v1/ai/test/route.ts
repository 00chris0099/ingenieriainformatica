import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api';
import { testProviderConnection } from '@/lib/ai-runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const provider = typeof body?.provider === 'string' ? body.provider : undefined;
    const model = typeof body?.model === 'string' ? body.model : undefined;
    const baseUrl = typeof body?.baseUrl === 'string' ? body.baseUrl : undefined;
    const apiKey = typeof body?.apiKey === 'string' ? body.apiKey : undefined;

    const result = await testProviderConnection(provider, model, baseUrl, apiKey);
    return apiSuccess(result);
  } catch (err: any) {
    return apiError(err?.message || 'Error probando la conexión de IA', 500);
  }
}
