import { PageTemplate } from '../types'

export const clinicClean: PageTemplate = {
  id: 'clinic-clean',
  name: 'Clínica Limpia',
  description: 'Sitio profesional para clínicas con servicios, doctores y citas',
  industry: 'clinic',
  category: 'landing',
  blocks: [
    {
      id: 'hero-clinic',
      type: 'hero',
      settings: {
        variant: 'centered',
        height: 'full',
        backgroundType: 'color',
        backgroundColor: '#ffffff',
        textColor: '#1e3a5f',
        overlayOpacity: 0,
        textAlign: 'center',
        paddingY: '120px',
      },
      content: {
        title: 'Tu Salud en Buenas Manos',
        subtitle: 'Equipo médico de primer nivel con tecnología avanzada. Agenda tu cita hoy.',
        buttonText: 'Agendar Cita',
        buttonLink: '#citas',
        buttonVariant: 'primary',
        secondaryButtonText: 'Ver Servicios',
        secondaryButtonLink: '#servicios',
      },
    },
    {
      id: 'features-clinic',
      type: 'features',
      settings: {
        columns: 4,
        layout: 'vertical',
        iconStyle: 'rounded',
        iconColor: '#2563eb',
      },
      content: {
        title: '¿Por qué elegirnos?',
        items: [
          { title: 'Doctores Certificados', description: 'Médicos con especialidad y experiencia', icon: 'award' },
          { title: 'Tecnología Moderna', description: 'Equipos de última generación', icon: 'monitor' },
          { title: 'Atención Personalizada', description: 'Cada paciente es único para nosotros', icon: 'heart' },
          { title: 'Citas Rápidas', description: 'Agenda en línea sin esperas', icon: 'calendar' },
        ],
      },
    },
    {
      id: 'services-clinic',
      type: 'text',
      settings: {
        layout: 'centered',
        maxWidth: '800px',
      },
      content: {
        title: 'Nuestros Servicios',
        subtitle: 'Ofrecemos una amplia gama de servicios médicos para ti y tu familia',
      },
    },
    {
      id: 'testimonials-clinic',
      type: 'testimonials',
      settings: {
        layout: 'cards',
        columns: 3,
        showRating: true,
        avatarStyle: 'circle',
      },
      content: {
        title: 'Testimonios de Pacientes',
        items: [
          { name: 'Pedro Ramírez', role: 'Paciente', text: 'Excelente atención. El doctor explicó todo con paciencia y el tratamiento fue efectivo.', rating: 5 },
          { name: 'Carmen Vega', role: 'Paciente', text: 'Las instalaciones son modernas y el personal es muy amable. Totalmente recomendado.', rating: 5 },
          { name: 'Jorge Mendoza', role: 'Paciente', text: 'Agendar mi cita fue súper fácil. No tuve que esperar y me atendieron puntualmente.', rating: 5 },
        ],
      },
    },
    {
      id: 'cta-clinic',
      type: 'cta',
      settings: {
        variant: 'solid',
        backgroundColor: '#2563eb',
        textColor: '#ffffff',
        textAlign: 'center',
        paddingY: '64px',
      },
      content: {
        title: '¿Necesitas una Consulta?',
        subtitle: 'Nuestro equipo está listo para atenderte. Llama o agenda en línea.',
        buttonText: 'Contactar Ahora',
        buttonLink: '#contacto',
      },
    },
    {
      id: 'footer-clinic',
      type: 'footer',
      settings: {
        variant: 'full',
        backgroundColor: '#1e3a5f',
        textColor: '#ffffff',
        columns: 4,
      },
      content: {
        companyName: 'Clínica Bienestar',
        tagline: 'Cuidando tu salud desde 2005',
        copyright: '© 2026 Clínica Bienestar. Todos los derechos reservados.',
      },
    },
  ],
  theme: {
    fonts: { heading: 'Inter', body: 'Inter' },
    colors: {
      primary: '#2563eb',
      secondary: '#1e3a5f',
      accent: '#10b981',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
    },
    spacing: { section: '80px', block: '24px', container: '1100px' },
    borderRadius: '8px',
    shadows: { sm: '0 1px 3px rgba(0,0,0,0.06)', md: '0 4px 12px rgba(0,0,0,0.08)', lg: '0 12px 28px rgba(0,0,0,0.1)' },
  },
  seo: {
    metaTitle: 'Clínica Bienestar - Servicios Médicos de Calidad',
    metaDescription: 'Agenda tu cita en Clínica Bienestar. Doctores certificados, tecnología moderna y atención personalizada.',
    keywords: ['clínica', 'médico', 'cita médica', 'servicios de salud'],
  },
  settings: {},
}
