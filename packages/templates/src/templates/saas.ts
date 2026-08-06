import { PageTemplate } from '../types'

export const saasModern: PageTemplate = {
  id: 'saas-modern',
  name: 'SaaS Moderno',
  description: 'Landing page para productos SaaS con pricing y features',
  industry: 'saas',
  category: 'landing',
  blocks: [
    {
      id: 'hero-saas',
      type: 'hero',
      settings: {
        variant: 'centered',
        height: 'full',
        backgroundType: 'color',
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        overlayOpacity: 0,
        textAlign: 'center',
        paddingY: '120px',
      },
      content: {
        title: 'Simplifica Tu Flujo de Trabajo',
        subtitle: 'La plataforma todo-en-uno que tu equipo necesita. Automatiza tareas, colabora en tiempo real y aumenta tu productividad.',
        buttonText: 'Prueba Gratis',
        buttonLink: '#registro',
        buttonVariant: 'primary',
        secondaryButtonText: 'Ver Demo',
        secondaryButtonLink: '#demo',
      },
    },
    {
      id: 'logos-saas',
      type: 'social-proof',
      settings: {
        layout: 'logo-cloud',
        align: 'center',
      },
      content: {
        title: 'Empresas que confían en nosotros',
        items: [
          { name: 'Empresa 1' },
          { name: 'Empresa 2' },
          { name: 'Empresa 3' },
          { name: 'Empresa 4' },
          { name: 'Empresa 5' },
        ],
      },
    },
    {
      id: 'features-saas',
      type: 'features',
      settings: {
        columns: 3,
        layout: 'vertical',
        iconStyle: 'rounded',
        iconColor: '#6366f1',
      },
      content: {
        title: 'Todo lo que Necesitas',
        subtitle: 'Herramientas potentes para equipos modernos',
        items: [
          { title: 'Automatización', description: 'Automatiza tareas repetitivas y ahorra tiempo', icon: 'zap' },
          { title: 'Colaboración', description: 'Trabaja en equipo en tiempo real sin fricciones', icon: 'users' },
          { title: 'Analytics', description: 'Dashboards inteligentes para tomar mejores decisiones', icon: 'bar-chart' },
          { title: 'Integraciones', description: 'Conecta con las herramientas que ya usas', icon: 'puzzle' },
          { title: 'Seguridad', description: 'Encriptación de extremo a extremo y cumplimiento GDPR', icon: 'shield' },
          { title: 'Soporte 24/7', description: 'Equipo de soporte disponible cuando lo necesites', icon: 'headphones' },
        ],
      },
    },
    {
      id: 'pricing-saas',
      type: 'pricing',
      settings: {
        columns: 3,
        layout: 'cards',
        highlightedPlan: 'business',
        currency: '$',
        period: '/mes',
      },
      content: {
        title: 'Planes Simplices y Transparentes',
        subtitle: 'Sin costos ocultos. Cancela cuando quieras.',
        items: [
          { name: 'Starter', price: '19', features: ['5 usuarios', '10GB almacenamiento', 'Soporte por email', 'Integraciones básicas'], highlighted: false },
          { name: 'Business', price: '49', features: ['25 usuarios', '100GB almacenamiento', 'Soporte prioritario', 'Todas las integraciones', 'API access'], highlighted: true },
          { name: 'Enterprise', price: '99', features: ['Usuarios ilimitados', 'Almacenamiento ilimitado', 'Soporte dedicado', 'SLA 99.9%', 'On-premise disponible'], highlighted: false },
        ],
      },
    },
    {
      id: 'testimonials-saas',
      type: 'testimonials',
      settings: {
        layout: 'cards',
        columns: 3,
        showRating: false,
        avatarStyle: 'rounded',
      },
      content: {
        title: 'Lo que Dicen Nuestros Usuarios',
        items: [
          { name: 'Ana Martínez', role: 'CTO, StartupX', text: 'Cambiamos a esta plataforma y nuestra productividad aumentó un 40%. Increíble.', rating: 5 },
          { name: 'Roberto Silva', role: 'PM, TechCorp', text: 'La mejor inversión que hicimos este año. El equipo la ama.', rating: 5 },
          { name: 'Laura García', role: 'CEO, InnovateLab', text: 'Finalmente una herramienta que cumple todo lo que promete.', rating: 5 },
        ],
      },
    },
    {
      id: 'faq-saas',
      type: 'faq',
      settings: {
        layout: 'accordion',
        columns: 1,
      },
      content: {
        title: 'Preguntas Frecuentes',
        items: [
          { question: '¿Puedo cambiar de plan después?', answer: 'Sí, puedes upgrade o downgrade en cualquier momento. Los cambios se aplican inmediatamente con prorrateo.' },
          { question: '¿Hay período de prueba?', answer: 'Sí, ofrecemos 14 días de prueba gratuita sin tarjeta de crédito.' },
          { question: '¿Mis datos están seguros?', answer: 'Absolutamente. Usamos encriptación AES-256 y cumplimos con GDPR y SOC 2.' },
        ],
      },
    },
    {
      id: 'cta-saas',
      type: 'cta',
      settings: {
        variant: 'gradient',
        backgroundColor: '#6366f1',
        textColor: '#ffffff',
        textAlign: 'center',
        paddingY: '80px',
      },
      content: {
        title: 'Comienza Hoy Gratis',
        subtitle: 'Sin tarjeta de crédito. Configuración en 2 minutos.',
        buttonText: 'Empezar Gratis',
        buttonLink: '#registro',
      },
    },
    {
      id: 'footer-saas',
      type: 'footer',
      settings: {
        variant: 'full',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        columns: 4,
      },
      content: {
        companyName: 'MiSaaS',
        tagline: 'Potenciando equipos desde 2024',
        copyright: '© 2026 MiSaaS. Todos los derechos reservados.',
      },
    },
  ],
  theme: {
    fonts: { heading: 'Inter', body: 'Inter' },
    colors: {
      primary: '#6366f1',
      secondary: '#0f172a',
      accent: '#06b6d4',
      background: '#ffffff',
      text: '#0f172a',
      muted: '#64748b',
    },
    spacing: { section: '96px', block: '24px', container: '1200px' },
    borderRadius: '12px',
    shadows: { sm: '0 1px 3px rgba(0,0,0,0.05)', md: '0 4px 12px rgba(0,0,0,0.08)', lg: '0 12px 28px rgba(0,0,0,0.1)' },
  },
  seo: {
    metaTitle: 'MiSaaS - Plataforma Todo-en-uno para Equipos',
    metaDescription: 'Simplifica tu flujo de trabajo con MiSaaS. Automatización, colaboración y analytics en una sola plataforma.',
    keywords: ['SaaS', 'software', 'productividad', 'automatización', 'colaboración'],
  },
  settings: {},
}
