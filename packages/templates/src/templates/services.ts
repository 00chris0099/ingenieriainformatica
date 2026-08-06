import { PageTemplate } from '../types'

export const servicesCorporate: PageTemplate = {
  id: 'services-corporate',
  name: 'Servicios Corporativos',
  description: 'Sitio profesional para agencias y consultoras',
  industry: 'services',
  category: 'landing',
  blocks: [
    {
      id: 'hero-services',
      type: 'hero',
      settings: {
        variant: 'centered',
        height: 'full',
        backgroundType: 'color',
        backgroundColor: '#1e293b',
        textColor: '#ffffff',
        overlayOpacity: 0,
        textAlign: 'center',
        paddingY: '120px',
      },
      content: {
        title: 'Soluciones que Impulsan tu Negocio',
        subtitle: 'Consultoría estratégica y servicios digitales para empresas que quieren crecer.',
        buttonText: 'Solicitar Consulta',
        buttonLink: '#contacto',
        buttonVariant: 'primary',
        secondaryButtonText: 'Nuestros Servicios',
        secondaryButtonLink: '#servicios',
      },
    },
    {
      id: 'features-services',
      type: 'features',
      settings: {
        columns: 3,
        layout: 'vertical',
        iconStyle: 'rounded',
        iconColor: '#3b82f6',
      },
      content: {
        title: 'Nuestros Servicios',
        items: [
          { title: 'Consultoría Digital', description: 'Estrategias personalizadas para tu transformación digital', icon: 'lightbulb' },
          { title: 'Desarrollo Web', description: 'Aplicaciones web modernas y escalables', icon: 'code' },
          { title: 'Marketing Digital', description: 'Campañas que generan resultados medibles', icon: 'trending-up' },
        ],
      },
    },
    {
      id: 'text-services',
      type: 'text',
      settings: {
        layout: 'centered',
        maxWidth: '800px',
      },
      content: {
        title: '¿Cómo Trabajamos?',
        subtitle: 'Nuestro proceso está diseñado para maximizar el valor en cada etapa',
      },
    },
    {
      id: 'columns-services',
      type: 'columns',
      settings: {
        columns: 3,
        gap: '24px',
      },
      content: {
        title: 'Nuestro Proceso',
        items: [
          { title: '1. Descubrimiento', description: 'Analizamos tu negocio, objetivos y desafíos para entender tus necesidades.' },
          { title: '2. Estrategia', description: 'Diseñamos un plan de acción personalizado con KPIs claros y medibles.' },
          { title: '3. Ejecución', description: 'Implementamos las soluciones con metodología ágil y entregas incrementales.' },
        ],
      },
    },
    {
      id: 'testimonials-services',
      type: 'testimonials',
      settings: {
        layout: 'cards',
        columns: 3,
        showRating: false,
        avatarStyle: 'rounded',
      },
      content: {
        title: 'Clientes Satisfechos',
        items: [
          { name: 'Fernando Gómez', role: 'CEO, RetailMax', text: 'Su consultoría nos ayudó a aumentar las ventas online un 200% en 6 meses.', rating: 5 },
          { name: 'Patricia Vega', role: 'Directora, InnovaGroup', text: 'Profesionales de primer nivel. El proyecto se entregó a tiempo y superó expectativas.', rating: 5 },
          { name: 'Roberto Díaz', role: 'CTO, TechStart', text: 'La mejor inversión que hicimos. Su equipo se siente como una extensión del nuestro.', rating: 5 },
        ],
      },
    },
    {
      id: 'cta-services',
      type: 'cta',
      settings: {
        variant: 'solid',
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        textAlign: 'center',
        paddingY: '80px',
      },
      content: {
        title: '¿Listo para Crecer?',
        subtitle: 'Agenda una consulta gratuita y descubre cómo podemos ayudarte.',
        buttonText: 'Agendar Consulta Gratis',
        buttonLink: '#contacto',
      },
    },
    {
      id: 'footer-services',
      type: 'footer',
      settings: {
        variant: 'full',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        columns: 4,
      },
      content: {
        companyName: 'DigitalPro',
        tagline: 'Consultoría y Desarrollo Digital',
        copyright: '© 2026 DigitalPro. Todos los derechos reservados.',
      },
    },
  ],
  theme: {
    fonts: { heading: 'Inter', body: 'Inter' },
    colors: {
      primary: '#3b82f6',
      secondary: '#1e293b',
      accent: '#10b981',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
    },
    spacing: { section: '96px', block: '24px', container: '1200px' },
    borderRadius: '8px',
    shadows: { sm: '0 1px 3px rgba(0,0,0,0.06)', md: '0 4px 12px rgba(0,0,0,0.08)', lg: '0 12px 28px rgba(0,0,0,0.1)' },
  },
  seo: {
    metaTitle: 'DigitalPro - Consultoría y Desarrollo Digital',
    metaDescription: 'Consultoría estratégica y servicios digitales para empresas. Transformación digital, desarrollo web y marketing.',
    keywords: ['consultoría', 'desarrollo web', 'marketing digital', 'servicios empresariales'],
  },
  settings: {},
}
