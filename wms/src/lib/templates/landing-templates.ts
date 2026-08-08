// ═══════════════════════════════════════════════════════════════════════════
// LANDING PAGES DE ALTA CONVERSIÓN — una sola ventana (scroll continuo)
// ═══════════════════════════════════════════════════════════════════════════

export const LANDING_TEMPLATES = [
  {
    id: 'tpl-fit-force',
    name: 'FitForce - Landing Fitness & Entrenamiento',
    description: 'Landing de alta conversión para academias de fitness: hero con resultado, prueba social con números, planes, FAQ de objeciones y CTA de inscripción.',
    industry: 'fitness',
    category: 'landing',
    type: 'landing',
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop',
    seo: {
      title: 'FitForce | Entrena, Transforma y Supera tus Límites',
      description: 'Entrenamientos personalizados con coaches certificados. Prueba 7 días gratis y transforma tu cuerpo desde la primera semana.',
    },
    settings: {
      primaryColor: '#16a34a',
      secondaryColor: '#052e16',
      accentColor: '#22c55e',
      whatsappNumber: '51999888777',
    },
    blocks: [
      {
        id: 'ff-hero',
        type: 'hero',
        settings: { backgroundColor: '#052e16', textColor: '#ffffff', accentColor: '#22c55e', paddingY: 110 },
        content: {
          badge: 'PLAZAS LIMITADAS · INSCRIPCIONES MARZO',
          title: 'Transforma tu Cuerpo en 12 Semanas con Coaches que Sí Resultan',
          subtitle: 'Plan personalizado, seguimiento semanal y nutrición guiada. 94% de nuestros alumnos logra sus metas. Empieza hoy con 7 días de prueba.',
          buttonText: 'Quiero Mi Plan Gratis',
          secondaryButtonText: 'Ver Planes y Precios',
          heroImage: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1000&auto=format&fit=crop',
        },
      },
      {
        id: 'ff-social-proof',
        type: 'features',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#22c55e', paddingY: 56 },
        content: {
          title: 'Resultados que Hablan',
          items: [
            { iconName: 'Users', title: '+2,400 alumnos', description: 'transformados desde 2021 en todo el Perú.' },
            { iconName: 'TrendingUp', title: '94% de éxito', description: 'alumnos que cumplen su objetivo en 12 semanas.' },
            { iconName: 'Star', title: '4.9/5 rating', description: 'basado en 1,800+ reseñas verificadas.' },
            { iconName: 'CalendarCheck', title: 'Seguimiento semanal', description: 'mediciones, ajustes y accountability real.' },
          ],
        },
      },
      {
        id: 'ff-features',
        type: 'features',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#22c55e', paddingY: 72 },
        content: {
          title: '¿Qué Incluye tu Membresía FitForce?',
          items: [
            { iconName: 'Dumbbell', title: 'Rutinas Personalizadas', description: 'Entrenamiento diseñado para tu nivel, lesiones y disponibilidad.' },
            { iconName: 'UtensilsCrossed', title: 'Plan Nutricional', description: 'Menús según tu meta: perder grasa, ganar músculo o mantenerte.' },
            { iconName: 'Video', title: 'Clases en Vivo y Grabadas', description: 'Entrena desde casa o en el gym con sesiones ilimitadas.' },
            { iconName: 'MessageCircle', title: 'Coach por WhatsApp', description: 'Resuelve tus dudas en menos de 30 minutos, 7 días a la semana.' },
            { iconName: 'HeartPulse', title: 'Checks de Progreso', description: 'Fotos, medidas y análisis de composición corporal cada 4 semanas.' },
            { iconName: 'ShieldCheck', title: 'Garantía de 30 Días', description: 'Si no ves cambios, te devolvemos tu dinero sin preguntas.' },
          ],
        },
      },
      {
        id: 'ff-pricing',
        type: 'pricing',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#22c55e', paddingY: 80 },
        content: {
          title: 'Elige tu Plan de Transformación',
          subtitle: 'Sin permanencia obligatoria. Cancela cuando quieras.',
          plans: [
            { name: 'Básico', price: 'S/ 89/mes', features: ['Rutinas grabadas', 'Guía nutricional PDF', 'Comunidad privada', 'Soporte por email'] },
            { name: 'Pro', price: 'S/ 149/mes', features: ['Todo lo del Básico', 'Clases en vivo', 'Coach por WhatsApp', 'Plan nutricional personalizado', 'Checks de progreso'], highlight: true },
            { name: 'Élite', price: 'S/ 249/mes', features: ['Todo lo del Pro', '1 sesión 1:1 al mes', 'Plan 100% a tu medida', 'Soporte prioritario 24/7'] },
          ],
        },
      },
      {
        id: 'ff-testimonials',
        type: 'testimonials',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', paddingY: 72 },
        content: {
          title: 'Historias Reales de Transformación',
          items: [
            { text: 'Bajé 18 kilos en 5 meses. El plan nutricional y el seguimiento del coach hicieron toda la diferencia. Nunca me sentí solo en el proceso.', name: 'Miguel A.', role: 'Alumno desde 2023 · Lima' },
            { text: 'Como mamá con poco tiempo, las rutinas de 30 minutos y las clases en vivo fueron perfectas. Estoy más fuerte que nunca.', name: 'Camila R.', role: 'Alumna desde 2024 · Arequipa' },
            { text: 'Llevaba años intentando en el gym solo. Con FitForce por fin entendí cómo entrenar y comer. Los resultados hablan solos.', name: 'Jorge P.', role: 'Alumno desde 2022 · Trujillo' },
          ],
        },
      },
      {
        id: 'ff-faq',
        type: 'faq',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#22c55e', paddingY: 72 },
        content: {
          title: 'Preguntas Frecuentes',
          subtitle: 'Resolvemos tus dudas antes de empezar',
          items: [
            { question: '¿Necesito experiencia previa en el gym?', answer: 'No. Todos los planes incluyen rutinas para principiantes y el coach ajusta cada ejercicio a tu nivel actual. El 60% de nuestros alumnos empezó desde cero.' },
            { question: '¿En cuánto tiempo veré resultados?', answer: 'La mayoría de alumnos nota cambios visibles entre la semana 3 y 5. A las 12 semanas, el 94% cumple su objetivo principal de pérdida de grasa o ganancia muscular.' },
            { question: '¿Cómo funciona la garantía de 30 días?', answer: 'Si sigues el plan completo y no ves resultados en 30 días, te devolvemos el 100% de tu dinero. Sin letra pequeña ni condiciones ocultas.' },
            { question: '¿Puedo cancelar cuando quiera?', answer: 'Sí. No hay permanencia obligatoria. Puedes cancelar desde el panel del alumno en un clic, sin llamadas ni trámites.' },
            { question: '¿Los pagos son seguros?', answer: 'Aceptamos tarjetas, Yape, Plin y transferencia. Todos los pagos digitales son procesados de forma segura y puedes pedir factura.' },
          ],
        },
      },
      {
        id: 'ff-cta',
        type: 'cta',
        settings: { accentColor: '#22c55e', paddingY: 90 },
        content: {
          title: 'Empieza Hoy: 7 Días de Prueba por S/ 9.90',
          description: 'Solo 40 plazas por mes para garantizar la calidad del seguimiento. Únete ahora y recibe además tu guía de alimentación de regalo.',
          buttonText: 'Inscribirme por WhatsApp',
        },
      },
      {
        id: 'ff-contact',
        type: 'contact',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#22c55e', paddingY: 64 },
        content: {
          title: '¿Tienes Más Preguntas?',
          subtitle: 'Escríbenos y un coach te responde en menos de 30 minutos.',
          buttonText: 'Hablar con un Coach',
        },
      },
      {
        id: 'ff-footer',
        type: 'footer',
        settings: { backgroundColor: '#052e16', textColor: '#ffffff', paddingY: 48 },
        content: {
          brandName: 'FITFORCE PERÚ',
          copyright: '© 2026 FitForce. Todos los derechos reservados. Impulsado por WMS Platform.',
        },
      },
    ],
  },
  {
    id: 'tpl-saas-flow',
    name: 'FlowSaaS - Landing de Software & Producto Digital',
    description: 'Landing B2B para software: problema-solución, features con beneficios, pricing mensual/anual, testimonios de empresas y CTA de demo.',
    industry: 'software',
    category: 'landing',
    type: 'landing',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
    seo: {
      title: 'FlowSaaS | Automatiza tu Negocio en Minutos',
      description: 'La plataforma todo-en-uno para automatizar ventas, cobros y reportes. Prueba gratis 14 días, sin tarjeta. Usada por 3,000+ empresas.',
    },
    settings: {
      primaryColor: '#2563eb',
      secondaryColor: '#0f172a',
      accentColor: '#3b82f6',
      whatsappNumber: '51999888777',
    },
    blocks: [
      {
        id: 'fs-hero',
        type: 'hero',
        settings: { backgroundColor: '#0f172a', textColor: '#ffffff', accentColor: '#3b82f6', paddingY: 110 },
        content: {
          badge: 'NUEVO · INTEGRACIÓN CON IA',
          title: 'Automatiza Ventas, Cobros y Reportes Sin Escribir una Línea de Código',
          subtitle: 'FlowSaaS conecta tu WhatsApp, correo y facturación en una sola plataforma. Empresas que la usan ahorran 12+ horas a la semana.',
          buttonText: 'Probar Gratis 14 Días',
          secondaryButtonText: 'Ver Demo de 5 Minutos',
          heroImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop',
        },
      },
      {
        id: 'fs-social-proof',
        type: 'features',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#3b82f6', paddingY: 56 },
        content: {
          title: 'Resultados Medibles para tu Empresa',
          items: [
            { iconName: 'Building2', title: '3,000+ empresas', description: 'de Latinoamérica ya automatizan con FlowSaaS.' },
            { iconName: 'Clock', title: '12h ahorradas', description: 'por semana en tareas manuales de venta y cobro.' },
            { iconName: 'TrendingUp', title: '+38% conversión', description: 'en promedio al responder clientes en minutos.' },
            { iconName: 'Users', title: 'Soporte real', description: 'humanos en español, 24/7, sin bots frustrantes.' },
          ],
        },
      },
      {
        id: 'fs-features',
        type: 'features',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#3b82f6', paddingY: 80 },
        content: {
          title: 'Todo lo que Necesitas para Vender Más',
          items: [
            { iconName: 'MessageSquare', title: 'CRM de WhatsApp', description: 'Todas tus conversaciones, etiquetadas y con historial del cliente.' },
            { iconName: 'CreditCard', title: 'Cobros Automáticos', description: 'Envía links de pago y recibe en Yape, Plin o tarjeta al instante.' },
            { iconName: 'BarChart3', title: 'Reportes en Tiempo Real', description: 'Ventas, comisiones y conversión actualizados al minuto.' },
            { iconName: 'Bot', title: 'Respuestas con IA', description: 'Asistente que responde preguntas frecuentes las 24 horas.' },
            { iconName: 'Plug', title: '+40 Integraciones', description: 'Conecta con Mercado Libre, Shopify, Google Sheets y más.' },
            { iconName: 'ShieldCheck', title: 'Seguridad Empresarial', description: 'Cifrado de extremo a extremo y copias de seguridad diarias.' },
          ],
        },
      },
      {
        id: 'fs-pricing',
        type: 'pricing',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#3b82f6', paddingY: 80 },
        content: {
          title: 'Precios Simples y Transparentes',
          subtitle: 'Ahorra 20% pagando anualmente. Sin costo de instalación.',
          plans: [
            { name: 'Starter', price: 'US$ 29/mes', features: ['1 usuario', 'CRM de WhatsApp', '100 conversaciones/mes', 'Reportes básicos', 'Soporte por email'] },
            { name: 'Growth', price: 'US$ 79/mes', features: ['Todo lo del Starter', '5 usuarios', 'Conversaciones ilimitadas', 'Cobros automáticos', 'Reportes avanzados', 'Soporte prioritario'], highlight: true },
            { name: 'Enterprise', price: 'A medida', features: ['Todo lo del Growth', 'Usuarios ilimitados', 'IA avanzada', 'Integraciones custom', 'SLA 99.9%', 'Gerente de cuenta'] },
          ],
        },
      },
      {
        id: 'fs-testimonials',
        type: 'testimonials',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', paddingY: 72 },
        content: {
          title: 'Empresas que ya Automatizan con FlowSaaS',
          items: [
            { text: 'Pasamos de perder pedidos por WhatsApp a cerrar 3x más ventas. El CRM y los links de pago nos cambiaron el negocio.', name: 'Daniela F.', role: 'CEO · Boutique Online' },
            { text: 'Implementamos FlowSaaS en una tarde. El equipo vende y cobra desde un solo lugar, y los reportes llegan solos.', name: 'Rodrigo M.', role: 'Gerente Comercial · Distribuidora' },
            { text: 'La integración con IA responde a nuestros clientes a cualquier hora. Es como tener un vendedor extra sin pagar sueldo.', name: 'Andrea V.', role: 'Fundadora · Agencia Digital' },
          ],
        },
      },
      {
        id: 'fs-faq',
        type: 'faq',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#3b82f6', paddingY: 72 },
        content: {
          title: 'Preguntas Frecuentes',
          subtitle: 'Todo lo que necesitas saber antes de empezar',
          items: [
            { question: '¿Puedo probar antes de pagar?', answer: 'Sí, ofrecemos 14 días de prueba gratis sin necesidad de tarjeta de crédito. Activa tu cuenta y explora todas las funciones.' },
            { question: '¿Necesito conocimientos técnicos?', answer: 'No. La plataforma está diseñada para que cualquier persona la configure en menos de una hora, con tutoriales guiados en español.' },
            { question: '¿Qué medios de pago acepto para cobrar?', answer: 'Tus clientes pueden pagarte con Yape, Plin, transferencia o tarjeta. Los cobros se acreditan directo a tu cuenta en 24 horas.' },
            { question: '¿Mis datos están seguros?', answer: 'Sí. Usamos cifrado AES-256, autenticación de dos factores y copias de seguridad diarias en múltiples servidores.' },
          ],
        },
      },
      {
        id: 'fs-cta',
        type: 'cta',
        settings: { accentColor: '#3b82f6', paddingY: 90 },
        content: {
          title: 'Comienza tu Prueba Gratis Hoy',
          description: 'Únete a 3,000+ empresas que ya ahorran tiempo y venden más. Sin tarjeta, sin permanencia, sin riesgo.',
          buttonText: 'Crear Cuenta Gratis',
        },
      },
      {
        id: 'fs-footer',
        type: 'footer',
        settings: { backgroundColor: '#0f172a', textColor: '#ffffff', paddingY: 48 },
        content: {
          brandName: 'FLOWSAAS',
          copyright: '© 2026 FlowSaaS. Todos los derechos reservados. Impulsado por WMS Platform.',
        },
      },
    ],
  },
  {
    id: 'tpl-master-course',
    name: 'MasterClass - Landing de Curso & Infoproducto',
    description: 'Landing de alta conversión para cursos online: promesa clara, módulos, bonos, testimonios de alumnos, garantía 7 días y urgencia de plazas.',
    industry: 'educacion',
    category: 'landing',
    type: 'landing',
    thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop',
    seo: {
      title: 'MasterClass | Domina Ventas Digitales en 30 Días',
      description: 'El método paso a paso para lanzar y vender tu primer producto digital. +12,000 alumnos. Garantía total de 7 días.',
    },
    settings: {
      primaryColor: '#7c3aed',
      secondaryColor: '#1e1b4b',
      accentColor: '#8b5cf6',
      whatsappNumber: '51999888777',
    },
    blocks: [
      {
        id: 'mc-hero',
        type: 'hero',
        settings: { backgroundColor: '#1e1b4b', textColor: '#ffffff', accentColor: '#8b5cf6', paddingY: 110 },
        content: {
          badge: '+12,000 ALUMNOS · NUEVA EDICIÓN',
          title: 'Aprende a Vender por Internet y Genera tus Primeros S/ 5,000 en 30 Días',
          subtitle: 'El método paso a paso, sin tecnicismos, para lanzar tu producto digital. Incluye plantillas listas, comunidad y mentoría en vivo.',
          buttonText: 'Quiero el Curso Ahora',
          secondaryButtonText: 'Ver Temario Completo',
          heroImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1000&auto=format&fit=crop',
        },
      },
      {
        id: 'mc-social-proof',
        type: 'features',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#8b5cf6', paddingY: 56 },
        content: {
          title: 'Números que Respaldan el Método',
          items: [
            { iconName: 'GraduationCap', title: '12,400 alumnos', description: 'de 18 países ya pasaron por el curso.' },
            { iconName: 'Wallet', title: 'S/ 5,000+ en 30 días', description: 'es el promedio de ingresos de alumnos aplicados.' },
            { iconName: 'Star', title: '4.8/5 rating', description: 'en 3,200 reseñas verificadas.' },
            { iconName: 'ShieldCheck', title: 'Garantía 7 días', description: 'si no te gusta, te devolvemos el 100%.' },
          ],
        },
      },
      {
        id: 'mc-modules',
        type: 'features',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#8b5cf6', paddingY: 80 },
        content: {
          title: '¿Qué Aprenderás en el Curso?',
          items: [
            { iconName: 'Lightbulb', title: 'Módulo 1 · Validación', description: 'Encuentra una idea de producto digital que la gente quiera comprar.' },
            { iconName: 'PenTool', title: 'Módulo 2 · Creación', description: 'Arma tu curso o producto con plantillas y sin saber editar video.' },
            { iconName: 'Megaphone', title: 'Módulo 3 · Lanzamiento', description: 'La secuencia exacta de emails, posts y anuncios para vender.' },
            { iconName: 'LineChart', title: 'Módulo 4 · Escalado', description: 'Automatiza tus ventas y duplica ingresos con embudos recurrentes.' },
            { iconName: 'Users', title: 'Módulo 5 · Comunidad', description: 'Mentorías en vivo cada mes y grupo privado de alumnos.' },
            { iconName: 'Award', title: 'Certificación', description: 'Certificado de finalización avalado por 12,000+ alumnos.' },
          ],
        },
      },
      {
        id: 'mc-bonus',
        type: 'features',
        settings: { backgroundColor: '#1e1b4b', textColor: '#ffffff', accentColor: '#8b5cf6', paddingY: 64 },
        content: {
          title: 'Bonos de Esta Edición (Solo por Tiempo Limitado)',
          items: [
            { iconName: 'FileText', title: 'Bono 1 · 50 Plantillas', description: 'Emails, guiones y anuncios listos para copiar y pegar. Valor: S/ 150.' },
            { iconName: 'Bot', title: 'Bono 2 · Pack de IA', description: 'Prompts para crear contenido con ChatGPT en minutos. Valor: S/ 120.' },
            { iconName: 'Video', title: 'Bono 3 · Masterclass Extra', description: 'Cómo escalar a S/ 20,000/mes con embudos. Valor: S/ 200.' },
          ],
        },
      },
      {
        id: 'mc-pricing',
        type: 'pricing',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#8b5cf6', paddingY: 80 },
        content: {
          title: 'Inversión en tu Futuro',
          subtitle: 'Acceso de por vida + todas las actualizaciones gratis.',
          plans: [
            { name: 'Acceso Completo', price: 'S/ 297', features: ['Curso completo (5 módulos)', 'Todos los bonos', 'Comunidad privada', 'Mentoría en vivo mensual', 'Certificación', 'Acceso de por vida'], highlight: true },
          ],
        },
      },
      {
        id: 'mc-testimonials',
        type: 'testimonials',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', paddingY: 72 },
        content: {
          title: 'Historias de Alumnos que ya Venden',
          items: [
            { text: 'En mi tercer mes lancé mi primer ebook y vendí S/ 3,800. El módulo de lanzamiento es oro puro.', name: 'Paola G.', role: 'Alumna · Edición 2024' },
            { text: 'Venía de cero, sin redes ni audiencia. Con las plantillas y el método lancé en 21 días mi curso de cocina.', name: 'Luis T.', role: 'Alumno · Edición 2023' },
            { text: 'Lo que más valoro es la comunidad. Las mentorías en vivo resuelven dudas reales de mi negocio cada mes.', name: 'Karen S.', role: 'Alumna · Edición 2025' },
          ],
        },
      },
      {
        id: 'mc-faq',
        type: 'faq',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#8b5cf6', paddingY: 72 },
        content: {
          title: 'Preguntas Frecuentes',
          subtitle: 'Resuelve tus dudas antes de inscribirte',
          items: [
            { question: '¿Necesito experiencia previa en ventas?', answer: 'No. El curso parte desde cero absoluto y está diseñado para principiantes. El 70% de nuestros alumnos nunca había vendido online.' },
            { question: '¿Cuánto tiempo tengo que dedicar?', answer: 'El método está pensado para personas con trabajo. Dedica 1-2 horas al día, a tu ritmo, con acceso de por vida a las clases.' },
            { question: '¿Qué pasa si no me gusta?', answer: 'Tienes 7 días de garantía incondicional. Si el curso no es para ti, te devolvemos el 100% de tu dinero sin preguntas.' },
            { question: '¿El certificado tiene valor real?', answer: 'Sí, es un certificado de finalización que valida tu aprendizaje y puedes agregarlo a tu LinkedIn o CV.' },
          ],
        },
      },
      {
        id: 'mc-cta',
        type: 'cta',
        settings: { accentColor: '#8b5cf6', paddingY: 90 },
        content: {
          title: '¡Últimas 15 Plazas con los Bonos Incluidos!',
          description: 'Esta edición cierra al completar el cupo. Asegura tu lugar y empieza hoy mismo con acceso inmediato.',
          buttonText: 'Asegurar mi Lugar por WhatsApp',
        },
      },
      {
        id: 'mc-footer',
        type: 'footer',
        settings: { backgroundColor: '#1e1b4b', textColor: '#ffffff', paddingY: 48 },
        content: {
          brandName: 'MASTERCLASS VENTAS DIGITALES',
          copyright: '© 2026 MasterClass. Todos los derechos reservados. Impulsado por WMS Platform.',
        },
      },
    ],
  },
]
