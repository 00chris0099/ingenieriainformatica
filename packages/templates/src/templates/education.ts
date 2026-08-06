import { PageTemplate } from '../types'

export const educationModern: PageTemplate = {
  id: 'education-modern',
  name: 'Educación Moderna',
  description: 'Plataforma de cursos online con instructores y pricing',
  industry: 'education',
  category: 'landing',
  blocks: [
    {
      id: 'hero-education',
      type: 'hero',
      settings: {
        variant: 'centered',
        height: 'full',
        backgroundType: 'gradient',
        backgroundColor: '#059669',
        textColor: '#ffffff',
        overlayOpacity: 0,
        textAlign: 'center',
        paddingY: '120px',
      },
      content: {
        title: 'Aprende Sin Límites',
        subtitle: 'Cursos online impartidos por expertos. Aprende a tu ritmo, desde cualquier lugar del mundo.',
        buttonText: 'Explorar Cursos',
        buttonLink: '#cursos',
        buttonVariant: 'primary',
        secondaryButtonText: 'Ver Planes',
        secondaryButtonLink: '#planes',
      },
    },
    {
      id: 'features-education',
      type: 'features',
      settings: {
        columns: 4,
        layout: 'vertical',
        iconStyle: 'rounded',
        iconColor: '#059669',
      },
      content: {
        title: '¿Por qué aprender con nosotros?',
        items: [
          { title: 'Cursos en Video', description: 'Contenido en HD grabado por expertos', icon: 'play-circle' },
          { title: 'Certificados', description: 'Obtén certificados reconocidos por la industria', icon: 'award' },
          { title: 'A tu Ritmo', description: 'Estudia cuando quieras, sin horarios', icon: 'clock' },
          { title: 'Comunidad', description: 'Únete a miles de estudiantes activos', icon: 'users' },
        ],
      },
    },
    {
      id: 'courses-education',
      type: 'product-grid',
      settings: {
        columns: 3,
        showPrices: true,
        showAddToCart: true,
        showBadges: true,
        badgeStyle: 'tag',
      },
      content: {
        title: 'Cursos Populares',
        subtitle: 'Los más elegidos por nuestra comunidad',
      },
    },
    {
      id: 'pricing-education',
      type: 'pricing',
      settings: {
        columns: 3,
        layout: 'cards',
        highlightedPlan: 'pro',
        currency: '$',
        period: '/mes',
      },
      content: {
        title: 'Planes de Suscripción',
        subtitle: 'Acceso ilimitado a todo el contenido',
        items: [
          { name: 'Básico', price: '19', features: ['5 cursos/mes', 'Soporte comunitario', 'Certificados básicos'], highlighted: false },
          { name: 'Pro', price: '39', features: ['Cursos ilimitados', 'Soporte prioritario', 'Certificados premium', 'Proyectos prácticos'], highlighted: true },
          { name: 'Teams', price: '99', features: ['Todo del plan Pro', 'Hasta 20 usuarios', 'Dashboard de admin', 'Soporte dedicado'], highlighted: false },
        ],
      },
    },
    {
      id: 'testimonials-education',
      type: 'testimonials',
      settings: {
        layout: 'carousel',
        columns: 3,
        showRating: true,
        avatarStyle: 'circle',
      },
      content: {
        title: 'Historias de Éxito',
        items: [
          { name: 'María López', role: 'Estudiante de Desarrollo', text: 'Gracias a estos cursos conseguí mi primer empleo como desarrolladora frontend.', rating: 5 },
          { name: 'Carlos Ruiz', role: 'Diseñador UI/UX', text: 'Los cursos de diseño son excepcionales. Aprendí técnicas que uso todos los días.', rating: 5 },
          { name: 'Ana Torres', role: 'Emprendedora', text: 'Los cursos de negocio me ayudaron a lanzar mi startup exitosamente.', rating: 5 },
        ],
      },
    },
    {
      id: 'faq-education',
      type: 'faq',
      settings: {
        layout: 'accordion',
        columns: 1,
      },
      content: {
        title: 'Preguntas Frecuentes',
        items: [
          { question: '¿Los cursos tienen certificado?', answer: 'Sí, todos nuestros cursos incluyen un certificado de finalización reconocido por la industria.' },
          { question: '¿Puedo acceder los cursos offline?', answer: 'Sí, puedes descargar el contenido video para verlo sin conexión desde nuestra app móvil.' },
          { question: '¿Hay garantía de devolución?', answer: 'Sí, ofrecemos 30 días de garantía. Si no estás satisfecho, te devolvemos tu dinero.' },
        ],
      },
    },
    {
      id: 'footer-education',
      type: 'footer',
      settings: {
        variant: 'full',
        backgroundColor: '#064e3b',
        textColor: '#ffffff',
        columns: 4,
      },
      content: {
        companyName: 'EduPlatform',
        tagline: 'Aprende, crece, transforma',
        copyright: '© 2026 EduPlatform. Todos los derechos reservados.',
      },
    },
  ],
  theme: {
    fonts: { heading: 'Poppins', body: 'Inter' },
    colors: {
      primary: '#059669',
      secondary: '#064e3b',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
    },
    spacing: { section: '96px', block: '24px', container: '1200px' },
    borderRadius: '12px',
    shadows: { sm: '0 1px 3px rgba(0,0,0,0.05)', md: '0 4px 12px rgba(0,0,0,0.08)', lg: '0 12px 28px rgba(0,0,0,0.1)' },
  },
  seo: {
    metaTitle: 'EduPlatform - Aprende Online con Expertos',
    metaDescription: 'Cursos online impartidos por expertos. Aprende a tu ritmo y obtén certificados reconocidos.',
    keywords: ['cursos online', 'educación', 'aprender', 'certificados', 'e-learning'],
  },
  settings: {},
}
