import { PageTemplate } from '../types'

export const portfolioMinimal: PageTemplate = {
  id: 'portfolio-minimal',
  name: 'Portafolio Minimalista',
  description: 'Showcase elegante para profesionales y freelancers',
  industry: 'portfolio',
  category: 'landing',
  blocks: [
    {
      id: 'hero-portfolio',
      type: 'hero',
      settings: {
        variant: 'left',
        height: 'full',
        backgroundType: 'color',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        overlayOpacity: 0,
        textAlign: 'left',
        paddingY: '120px',
      },
      content: {
        title: 'Hola, Soy [Tu Nombre]',
        subtitle: 'Diseñador UI/UX & Desarrollador Frontend. Creo experiencias digitales que enamoran.',
        buttonText: 'Ver Proyectos',
        buttonLink: '#proyectos',
        buttonVariant: 'primary',
        secondaryButtonText: 'Contactar',
        secondaryButtonLink: '#contacto',
      },
    },
    {
      id: 'features-portfolio',
      type: 'features',
      settings: {
        columns: 3,
        layout: 'vertical',
        iconStyle: 'rounded',
        iconColor: '#6366f1',
      },
      content: {
        title: 'Mis Habilidades',
        items: [
          { title: 'Diseño UI/UX', description: 'Interfaces intuitivas y visualmente atractivas', icon: 'palette' },
          { title: 'Desarrollo Frontend', description: 'React, Next.js, TypeScript, Tailwind', icon: 'code' },
          { title: 'Branding', description: 'Identidad visual que comunica tu esencia', icon: 'sparkles' },
        ],
      },
    },
    {
      id: 'gallery-portfolio',
      type: 'gallery',
      settings: {
        layout: 'grid',
        columns: 2,
        gap: '16px',
        borderRadius: '12px',
        lightbox: true,
      },
      content: {
        title: 'Proyectos Destacados',
        subtitle: 'Una selección de mi mejor trabajo',
        images: [
          { src: '/images/project-1.jpg', alt: 'Proyecto E-Commerce' },
          { src: '/images/project-2.jpg', alt: 'App Móvil' },
          { src: '/images/project-3.jpg', alt: 'Branding Corporativo' },
          { src: '/images/project-4.jpg', alt: 'Dashboard Web' },
        ],
      },
    },
    {
      id: 'contact-portfolio',
      type: 'contact',
      settings: {
        layout: 'split',
        showMap: false,
        showPhone: true,
        showEmail: true,
        showAddress: false,
      },
      content: {
        title: 'Hablemos',
        subtitle: '¿Tienes un proyecto en mente? Me encantaría escuchar tu idea.',
      },
    },
    {
      id: 'footer-portfolio',
      type: 'footer',
      settings: {
        variant: 'minimal',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        columns: 2,
      },
      content: {
        companyName: '[Tu Nombre]',
        tagline: 'Diseñador & Desarrollador',
        copyright: '© 2026 [Tu Nombre]. Todos los derechos reservados.',
      },
    },
  ],
  theme: {
    fonts: { heading: 'Space Grotesk', body: 'Inter' },
    colors: {
      primary: '#6366f1',
      secondary: '#0f172a',
      accent: '#06b6d4',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
    },
    spacing: { section: '96px', block: '24px', container: '1000px' },
    borderRadius: '12px',
    shadows: { sm: '0 1px 3px rgba(0,0,0,0.05)', md: '0 4px 12px rgba(0,0,0,0.08)', lg: '0 12px 28px rgba(0,0,0,0.1)' },
  },
  seo: {
    metaTitle: '[Tu Nombre] - Diseñador UI/UX & Desarrollador',
    metaDescription: 'Portafolio de [Tu Nombre]. Diseño UI/UX y desarrollo frontend para experiencias digitales excepcionales.',
    keywords: ['portafolio', 'diseñador UI/UX', 'desarrollador frontend', 'freelancer'],
  },
  settings: {},
}
