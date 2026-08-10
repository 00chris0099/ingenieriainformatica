import { resolveAnalyticsConfig } from '@/lib/analytics';

/**
 * GA4 Measurement Protocol — eventos server-side.
 * Requiere: measurement_id (G-...) + api_secret (creado en GA4 → Data Streams
 * → Measurement Protocol API secrets). Fire-and-forget: nunca rompe el flujo.
 *
 * Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

export interface GA4EventParams {
  [key: string]: string | number | boolean | Record<string, any> | Array<Record<string, any> | string | number> | undefined | null;
}

/** client_id estable derivado de un identificador (email) o aleatorio. */
export function stableClientId(seed?: string | null): string {
  if (!seed) return `wms-${Date.now()}.${Math.floor(Math.random() * 1e9)}`;
  let h = 5381;
  const s = seed.toLowerCase();
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return `wms-${(h >>> 0)}.${s.length}`;
}

export async function trackGA4Event(opts: {
  business: any;
  eventName: string;
  params?: GA4EventParams;
  clientId?: string | null;
  userId?: string | null;
}): Promise<void> {
  try {
    const cfg = resolveAnalyticsConfig(opts.business);
    if (!cfg.enabled || !cfg.gaId || !cfg.gaApiSecret) return;

    const clientId = opts.clientId || stableClientId(opts.userId);
    const body: any = {
      client_id: clientId,
      events: [
        {
          name: opts.eventName,
          params: { ...(opts.params || {}), engagement_time_msec: 1 },
        },
      ],
    };
    if (opts.userId) body.user_id = opts.userId;

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(cfg.gaId)}&api_secret=${encodeURIComponent(cfg.gaApiSecret)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[GA4 MP] ${opts.eventName} -> ${res.status} (${res.statusText})`);
    }
  } catch (e) {
    console.error('[GA4 MP]', (e as Error)?.message?.slice(0, 150));
  }
}
