/**
 * Configuración de analítica externa por tienda (business.settings.analytics):
 *   { enabled?, googleAnalyticsId?, plausibleDomain?, plausibleApiKey? }
 * GA4 solo necesita el ID de medición (G-...). Plausible necesita el dominio
 * del sitio y, para leer estadísticas desde el dashboard, el API key.
 */
export interface AnalyticsConfig {
  enabled: boolean;
  gaId: string | null;
  gaApiSecret: string | null;
  plausibleDomain: string | null;
  plausibleApiKey: string | null;
}

export function resolveAnalyticsConfig(business: any): AnalyticsConfig {
  const bizSettings: any = business?.settings && typeof business.settings === 'object' ? business.settings : {};
  const a: any = bizSettings.analytics && typeof bizSettings.analytics === 'object' ? bizSettings.analytics : {};
  return {
    enabled: a.enabled !== false,
    gaId: typeof a.googleAnalyticsId === 'string' && a.googleAnalyticsId.trim() ? a.googleAnalyticsId.trim() : null,
    gaApiSecret: typeof a.gaApiSecret === 'string' && a.gaApiSecret.trim() ? a.gaApiSecret.trim() : null,
    plausibleDomain: typeof a.plausibleDomain === 'string' && a.plausibleDomain.trim() ? a.plausibleDomain.trim() : null,
    plausibleApiKey: typeof a.plausibleApiKey === 'string' && a.plausibleApiKey.trim() ? a.plausibleApiKey.trim() : null,
  };
}

/** ¿El Measurement Protocol está operativo? (ID + API secret). */
export function isMPConfigured(business: any): boolean {
  const cfg = resolveAnalyticsConfig(business);
  return cfg.enabled && !!cfg.gaId && !!cfg.gaApiSecret;
}

export function maskAnalyticsKey(key?: string | null): string | undefined {
  if (!key) return undefined;
  if (key.length <= 8) return '••••••••';
  return `••••••••${key.slice(-4)}`;
}

/** Valida el formato de un ID de medición de GA4 (G-XXXXXXXXXX). */
export function isValidGaId(id: string): boolean {
  return /^G-[A-Z0-9]{6,}$/i.test(id.trim());
}
