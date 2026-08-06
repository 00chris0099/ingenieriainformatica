import { NextRequest } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache, cacheGet, cacheSet } from '@/lib/cache';
import { requireAuth } from '@/lib/api/auth-guard';

interface Settings {
  businessName: string;
  ruc: string;
  phone: string;
  address: string;
  email: string;
  currency: string;
}

const DEFAULT_SETTINGS: Settings = {
  businessName: '',
  ruc: '',
  phone: '',
  address: '',
  email: '',
  currency: 'PEN',
};

export async function GET() {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const settings = await cacheGet<Settings>('settings:business') || DEFAULT_SETTINGS;
    return apiSuccess(settings);
  } catch (error) {
    return handleApiError(error, 'settings-get');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const userRole = (authCheck.user as any).role;
    if (!['super_admin', 'admin'].includes(userRole)) {
      return apiError('Admin access required', 403);
    }

    const body = await request.json();
    const settings: Settings = { ...DEFAULT_SETTINGS, ...body };
    await cacheSet('settings:business', settings, 86400);
    return apiSuccess(settings);
  } catch (error) {
    return handleApiError(error, 'settings-put');
  }
}
