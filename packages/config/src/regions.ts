export interface PaymentProviderConfig {
  id: string
  name: string
  supportsRecurring: boolean
  supportsWebhooks: boolean
  currencies: string[]
}

export interface ShippingProviderConfig {
  id: string
  name: string
  trackingUrl: string
  services: string[]
}

export interface RegionConfig {
  id: string
  name: string
  currency: string
  currencySymbol: string
  taxName: string
  taxRate: number
  paymentProviders: PaymentProviderConfig[]
  shippingProviders: ShippingProviderConfig[]
  addressFormat: 'ubigeo' | 'standard' | 'uk' | 'eu'
  phoneFormat: string
  dateFormat: string
  locale: string
}

export const regionConfigs: Record<string, RegionConfig> = {
  peru: {
    id: 'peru',
    name: 'Perú',
    currency: 'PEN',
    currencySymbol: 'S/',
    taxName: 'IGV',
    taxRate: 0.18,
    paymentProviders: [
      { id: 'mercadopago', name: 'MercadoPago', supportsRecurring: true, supportsWebhooks: true, currencies: ['PEN', 'USD'] },
      { id: 'yape', name: 'Yape', supportsRecurring: false, supportsWebhooks: false, currencies: ['PEN'] },
      { id: 'plin', name: 'Plin', supportsRecurring: false, supportsWebhooks: false, currencies: ['PEN'] },
    ],
    shippingProviders: [
      { id: 'shalom', name: 'Shalom', trackingUrl: 'https://www.shalom.com.pe/seguimiento', services: ['estandar', 'express'] },
      { id: 'olva', name: 'Olva', trackingUrl: 'https://www.ova.com.pe/rastreo', services: ['estandar', 'express'] },
      { id: 'kuracachi', name: 'Kuracachi', trackingUrl: 'https://kuracachi.com/rastreo', services: ['estandar'] },
    ],
    addressFormat: 'ubigeo',
    phoneFormat: '+51',
    dateFormat: 'DD/MM/YYYY',
    locale: 'es-PE',
  },
  mexico: {
    id: 'mexico',
    name: 'México',
    currency: 'MXN',
    currencySymbol: '$',
    taxName: 'IVA',
    taxRate: 0.16,
    paymentProviders: [
      { id: 'mercadopago', name: 'MercadoPago', supportsRecurring: true, supportsWebhooks: true, currencies: ['MXN', 'USD'] },
      { id: 'stripe', name: 'Stripe', supportsRecurring: true, supportsWebhooks: true, currencies: ['MXN', 'USD'] },
      { id: 'oxxo', name: 'OXXO', supportsRecurring: false, supportsWebhooks: false, currencies: ['MXN'] },
    ],
    shippingProviders: [
      { id: 'fedex', name: 'FedEx', trackingUrl: 'https://www.fedex.com/fedextrack', services: ['standard', 'express', 'overnight'] },
      { id: 'dhl', name: 'DHL', trackingUrl: 'https://www.dhl.com/es-en/home/tracking.html', services: ['express', 'ecommerce'] },
      { id: 'estafeta', name: 'Estafeta', trackingUrl: 'https://www.estafeta.com/rastreo', services: ['standard', 'express'] },
    ],
    addressFormat: 'standard',
    phoneFormat: '+52',
    dateFormat: 'DD/MM/YYYY',
    locale: 'es-MX',
  },
  colombia: {
    id: 'colombia',
    name: 'Colombia',
    currency: 'COP',
    currencySymbol: '$',
    taxName: 'IVA',
    taxRate: 0.19,
    paymentProviders: [
      { id: 'mercadopago', name: 'MercadoPago', supportsRecurring: true, supportsWebhooks: true, currencies: ['COP', 'USD'] },
      { id: 'pse', name: 'PSE', supportsRecurring: false, supportsWebhooks: false, currencies: ['COP'] },
      { id: 'nequi', name: 'Nequi', supportsRecurring: false, supportsWebhooks: false, currencies: ['COP'] },
    ],
    shippingProviders: [
      { id: 'servientrega', name: 'Servientrega', trackingUrl: 'https://www.servientrega.com.co/rastreo', services: ['estandar', 'express'] },
      { id: 'envia', name: 'Envía', trackingUrl: 'https://envia.co/rastreo', services: ['estandar', 'express'] },
    ],
    addressFormat: 'standard',
    phoneFormat: '+57',
    dateFormat: 'DD/MM/YYYY',
    locale: 'es-CO',
  },
  argentina: {
    id: 'argentina',
    name: 'Argentina',
    currency: 'ARS',
    currencySymbol: 'AR$',
    taxName: 'IVA',
    taxRate: 0.21,
    paymentProviders: [
      { id: 'mercadopago', name: 'MercadoPago', supportsRecurring: true, supportsWebhooks: true, currencies: ['ARS', 'USD'] },
      { id: 'stripe', name: 'Stripe', supportsRecurring: true, supportsWebhooks: true, currencies: ['ARS', 'USD'] },
    ],
    shippingProviders: [
      { id: 'correo_argentino', name: 'Correo Argentino', trackingUrl: 'https://www.correoargentino.com.ar/rastreo', services: ['estandar', 'express'] },
      { id: 'ocasa', name: 'OcaSA', trackingUrl: 'https://www.oca.com.ar/rastreo', services: ['estandar'] },
    ],
    addressFormat: 'standard',
    phoneFormat: '+54',
    dateFormat: 'DD/MM/YYYY',
    locale: 'es-AR',
  },
  chile: {
    id: 'chile',
    name: 'Chile',
    currency: 'CLP',
    currencySymbol: 'CL$',
    taxName: 'IVA',
    taxRate: 0.19,
    paymentProviders: [
      { id: 'stripe', name: 'Stripe', supportsRecurring: true, supportsWebhooks: true, currencies: ['CLP', 'USD'] },
      { id: 'mercadopago', name: 'MercadoPago', supportsRecurring: true, supportsWebhooks: true, currencies: ['CLP', 'USD'] },
    ],
    shippingProviders: [
      { id: 'starken', name: 'Starken', trackingUrl: 'https://www.starken.cl/rastreo', services: ['estandar', 'express'] },
      { id: 'chilexpress', name: 'Chilexpress', trackingUrl: 'https://www.chilexpress.cl/rastreo', services: ['estandar', 'express'] },
    ],
    addressFormat: 'standard',
    phoneFormat: '+56',
    dateFormat: 'DD/MM/YYYY',
    locale: 'es-CL',
  },
  global: {
    id: 'global',
    name: 'Global (USD)',
    currency: 'USD',
    currencySymbol: '$',
    taxName: 'Tax',
    taxRate: 0,
    paymentProviders: [
      { id: 'stripe', name: 'Stripe', supportsRecurring: true, supportsWebhooks: true, currencies: ['USD', 'EUR', 'GBP'] },
      { id: 'paypal', name: 'PayPal', supportsRecurring: true, supportsWebhooks: true, currencies: ['USD', 'EUR', 'GBP'] },
    ],
    shippingProviders: [
      { id: 'fedex', name: 'FedEx', trackingUrl: 'https://www.fedex.com/fedextrack', services: ['standard', 'express', 'overnight'] },
      { id: 'dhl', name: 'DHL', trackingUrl: 'https://www.dhl.com/es-en/home/tracking.html', services: ['express', 'ecommerce'] },
      { id: 'ups', name: 'UPS', trackingUrl: 'https://www.ups.com/track', services: ['ground', 'express', 'overnight'] },
    ],
    addressFormat: 'standard',
    phoneFormat: '+1',
    dateFormat: 'MM/DD/YYYY',
    locale: 'en-US',
  },
}

export function getRegionConfig(region: string): RegionConfig | undefined {
  return regionConfigs[region]
}

export function getAllRegions(): RegionConfig[] {
  return Object.values(regionConfigs)
}

export function getRegionList(): Array<{ id: string; name: string; currency: string }> {
  return Object.values(regionConfigs).map(({ id, name, currency }) => ({ id, name, currency }))
}
