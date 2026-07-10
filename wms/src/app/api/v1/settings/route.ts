import { NextRequest } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache, cacheGet, cacheSet } from '@/lib/cache';

interface Settings {
  businessName: string;
  ruc: string;
  phone: string;
  address: string;
  email: string;
  currency: string;
}

const DEFAULT_SETTINGS: Settings = {
  businessName: 'ADRISU KIDS',
  ruc: '20512345678',
  phone: '+51 999 111 222',
  address: 'Av. Industrial 123, Lima, Peru',
  email: 'admin@adriskids.com',
  currency: 'PEN',
};

export async function GET() {
  try {
    const settings = await cacheGet<Settings>('settings:business') || DEFAULT_SETTINGS;
    return apiSuccess(settings);
  } catch (error) {
    return handleApiError(error, 'settings-get');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const settings: Settings = { ...DEFAULT_SETTINGS, ...body };
    await cacheSet('settings:business', settings, 86400); // 24 hours
    return apiSuccess(settings);
  } catch (error) {
    return handleApiError(error, 'settings-put');
  }
}
