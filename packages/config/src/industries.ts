export interface IndustryConfig {
  id: string
  name: string
  description: string
  defaultBlocks: string[]
  paymentProviders: string[]
  shippingProviders: string[]
  features: string[]
  defaultTemplate: string
  defaultCurrency: string
  defaultTaxRate: number
}

export const industryConfigs: Record<string, IndustryConfig> = {
  ecommerce: {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Tienda online con catálogo de productos, carrito y checkout',
    defaultBlocks: ['hero', 'product-grid', 'features', 'testimonials', 'cta', 'footer'],
    paymentProviders: ['mercadopago', 'stripe', 'paypal'],
    shippingProviders: ['fedex', 'dhl', 'ups', 'shalom', 'olva'],
    features: ['cart', 'checkout', 'product-catalog', 'blog', 'reviews', 'wishlist', 'coupons'],
    defaultTemplate: 'ecommerce-modern',
    defaultCurrency: 'PEN',
    defaultTaxRate: 18,
  },
  restaurant: {
    id: 'restaurant',
    name: 'Restaurante',
    description: 'Menú digital, reservas y pedidos online',
    defaultBlocks: ['hero', 'gallery', 'features', 'testimonials', 'contact', 'footer'],
    paymentProviders: ['stripe', 'cash'],
    shippingProviders: [],
    features: ['online-orders', 'reservations', 'menu-management', 'table-booking'],
    defaultTemplate: 'restaurant-elegant',
    defaultCurrency: 'PEN',
    defaultTaxRate: 18,
  },
  clinic: {
    id: 'clinic',
    name: 'Clínica / Consultorio',
    description: 'Servicios médicos, doctores y citas online',
    defaultBlocks: ['hero', 'features', 'testimonials', 'contact', 'faq', 'footer'],
    paymentProviders: ['stripe', 'cash'],
    shippingProviders: [],
    features: ['appointments', 'patient-portal', 'services-catalog', 'doctor-profiles'],
    defaultTemplate: 'clinic-clean',
    defaultCurrency: 'PEN',
    defaultTaxRate: 18,
  },
  gym: {
    id: 'gym',
    name: 'Gimnasio / Fitness',
    description: 'Planes de membresía, clases y entrenadores',
    defaultBlocks: ['hero', 'features', 'pricing', 'testimonials', 'cta', 'faq', 'footer'],
    paymentProviders: ['stripe', 'mercadopago'],
    shippingProviders: [],
    features: ['membership', 'class-schedule', 'trainer-profiles', 'booking'],
    defaultTemplate: 'gym-bold',
    defaultCurrency: 'PEN',
    defaultTaxRate: 18,
  },
  portfolio: {
    id: 'portfolio',
    name: 'Portafolio Personal',
    description: 'Showcase de proyectos y habilidades',
    defaultBlocks: ['hero', 'features', 'gallery', 'testimonials', 'contact', 'footer'],
    paymentProviders: [],
    shippingProviders: [],
    features: ['portfolio-gallery', 'contact-form', 'blog'],
    defaultTemplate: 'portfolio-minimal',
    defaultCurrency: 'USD',
    defaultTaxRate: 0,
  },
  saas: {
    id: 'saas',
    name: 'SaaS / Software',
    description: 'Página de producto con pricing y demos',
    defaultBlocks: ['hero', 'features', 'pricing', 'testimonials', 'cta', 'faq', 'footer'],
    paymentProviders: ['stripe'],
    shippingProviders: [],
    features: ['pricing-tables', 'feature-comparison', 'integrations', 'changelog'],
    defaultTemplate: 'saas-modern',
    defaultCurrency: 'USD',
    defaultTaxRate: 0,
  },
  education: {
    id: 'education',
    name: 'Educación / Cursos',
    description: 'Plataforma de cursos online y contenido educativo',
    defaultBlocks: ['hero', 'features', 'pricing', 'testimonials', 'cta', 'faq', 'footer'],
    paymentProviders: ['stripe', 'mercadopago'],
    shippingProviders: [],
    features: ['courses', 'enrollment', 'certificates', 'student-portal'],
    defaultTemplate: 'education-modern',
    defaultCurrency: 'PEN',
    defaultTaxRate: 18,
  },
  services: {
    id: 'services',
    name: 'Servicios Profesionales',
    description: 'Agencia, consultoría o servicios profesionales',
    defaultBlocks: ['hero', 'features', 'testimonials', 'contact', 'cta', 'faq', 'footer'],
    paymentProviders: ['stripe'],
    shippingProviders: [],
    features: ['service-catalog', 'team-profiles', 'booking', 'contact-form'],
    defaultTemplate: 'services-corporate',
    defaultCurrency: 'PEN',
    defaultTaxRate: 18,
  },
}

export function getIndustryConfig(industry: string): IndustryConfig | undefined {
  return industryConfigs[industry]
}

export function getAllIndustries(): IndustryConfig[] {
  return Object.values(industryConfigs)
}

export function getIndustryList(): Array<{ id: string; name: string; description: string }> {
  return Object.values(industryConfigs).map(({ id, name, description }) => ({ id, name, description }))
}
