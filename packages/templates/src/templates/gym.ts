import { PageTemplate } from '../types'

export const gymBold: PageTemplate = {
  id: 'gym-bold',
  name: 'Gimnasio Bold',
  description: 'Sitio energético para gimnasios con planes, clases y entrenadores',
  industry: 'gym',
  category: 'landing',
  blocks: [
    {
      id: 'hero-gym',
      type: 'hero',
      settings: {
        variant: 'centered',
        height: 'full',
        backgroundType: 'gradient',
        backgroundColor: '#dc2626',
        textColor: '#ffffff',
        overlayOpacity: 0,
        textAlign: 'center',
        paddingY: '140px',
      },
      content: {
        title: 'Supera Tus Límites',
        subtitle: 'Entrena con los mejores. Planes desde $29/mes. Primera semana gratis.',
        buttonText: 'Empezar Ahora',
        buttonLink: '#planes',
        buttonVariant: 'primary',
        secondaryButtonText: 'Ver Clases',
        secondaryButtonLink: '#clases',
      },
    },
    {
      id: 'features-gym',
      type: 'features',
      settings: {
        columns: 3,
        layout: 'vertical',
        iconStyle: 'rounded',
        iconColor: '#dc2626',
      },
      content: {
        title: 'Todo lo que Necesitas',
        items: [
          { title: 'Equipamiento Pro', description: 'Máquinas de última generación y pesas libres', icon: 'dumbbell' },
          { title: 'Clases Grupales', description: 'Más de 30 clases semanales: spinning, yoga, crossfit', icon: 'users' },
          { title: 'Entrenadores Certificados', description: 'Profesionales que te guían en cada paso', icon: 'award' },
        ],
      },
    },
    {
      id: 'pricing-gym',
      type: 'pricing',
      settings: {
        columns: 3,
        layout: 'cards',
        highlightedPlan: 'pro',
        currency: '$',
        period: '/mes',
      },
      content: {
        title: 'Elige Tu Plan',
        subtitle: 'Planes flexibles para cada objetivo',
        items: [
          { name: 'Básico', price: '29', features: ['Acceso al gimnasio', '1 clase grupal/día', 'App móvil'], highlighted: false },
          { name: 'Pro', price: '49', features: ['Acceso ilimitado', 'Todas las clases', '1 entrenador personal/mes', 'Sauna'], highlighted: true },
          { name: 'Elite', price: '79', features: ['Todo del plan Pro', 'Entrenador personal ilimitado', 'Nutrición personalizada', 'Spa'], highlighted: false },
        ],
      },
    },
    {
      id: 'testimonials-gym',
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
          { name: 'Luis Fernández', role: 'Miembro desde 2023', text: 'Perdí 20kg en 6 meses. Los entrenadores son increíbles y el ambiente es motivador.', rating: 5 },
          { name: 'Sofía Herrera', role: 'Miembro desde 2024', text: 'Las clases grupales son geniales. Nunca me había sentido tan bien.', rating: 5 },
          { name: 'Miguel Ángel Ríos', role: 'Miembro desde 2022', text: 'El mejor gimnasio de la zona. Equipamiento nuevo y personal muy profesional.', rating: 5 },
        ],
      },
    },
    {
      id: 'cta-gym',
      type: 'cta',
      settings: {
        variant: 'solid',
        backgroundColor: '#dc2626',
        textColor: '#ffffff',
        textAlign: 'center',
        paddingY: '80px',
      },
      content: {
        title: 'Tu Primera Semana es Gratis',
        subtitle: 'Sin compromiso. Cancela cuando quieras.',
        buttonText: 'Regístrate Gratis',
        buttonLink: '#registro',
      },
    },
    {
      id: 'footer-gym',
      type: 'footer',
      settings: {
        variant: 'full',
        backgroundColor: '#111827',
        textColor: '#ffffff',
        columns: 4,
      },
      content: {
        companyName: 'FitPower Gym',
        tagline: 'Tu fuerza, nuestra pasión',
        copyright: '© 2026 FitPower Gym. Todos los derechos reservados.',
      },
    },
  ],
  theme: {
    fonts: { heading: 'Oswald', body: 'Inter' },
    colors: {
      primary: '#dc2626',
      secondary: '#111827',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#111827',
      muted: '#6b7280',
    },
    spacing: { section: '96px', block: '24px', container: '1200px' },
    borderRadius: '8px',
    shadows: { sm: '0 1px 3px rgba(0,0,0,0.08)', md: '0 4px 12px rgba(0,0,0,0.1)', lg: '0 12px 32px rgba(0,0,0,0.15)' },
  },
  seo: {
    metaTitle: 'FitPower Gym - Entrena como un Profesional',
    metaDescription: 'El mejor gimnasio de la ciudad. Equipamiento pro, clases grupales y entrenadores certificados. Primera semana gratis.',
    keywords: ['gimnasio', 'fitness', 'entrenamiento', 'clases grupales'],
  },
  settings: {},
}
