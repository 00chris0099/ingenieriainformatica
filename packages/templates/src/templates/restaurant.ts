import { PageTemplate } from '../types'

export const restaurantElegant: PageTemplate = {
  id: 'restaurant-elegant',
  name: 'Restaurante Elegante',
  description: 'Menú digital, galería y reservas para restaurantes',
  industry: 'restaurant',
  category: 'landing',
  blocks: [
    {
      id: 'hero-restaurant',
      type: 'hero',
      settings: {
        variant: 'centered',
        height: 'full',
        backgroundType: 'image',
        backgroundImage: '/images/restaurant-hero.jpg',
        textColor: '#ffffff',
        overlayOpacity: 50,
        textAlign: 'center',
        paddingY: '160px',
      },
      content: {
        title: 'Sabores que Cuentan Historias',
        subtitle: 'Cocina contemporánea con ingredientes frescos de temporada. Reserva tu mesa hoy.',
        buttonText: 'Ver Menú',
        buttonLink: '#menu',
        buttonVariant: 'primary',
        secondaryButtonText: 'Reservar',
        secondaryButtonLink: '#reservas',
      },
    },
    {
      id: 'features-restaurant',
      type: 'features',
      settings: {
        columns: 3,
        layout: 'vertical',
        iconStyle: 'rounded',
        iconColor: '#d97706',
      },
      content: {
        title: 'Nuestra Propuesta',
        items: [
          { title: 'Cocina de Autor', description: 'Platos únicos con técnicas modernas y sabores tradicionales', icon: 'chef-hat' },
          { title: 'Ingredientes Frescos', description: 'Directo del productor a tu plato, sin intermediarios', icon: 'leaf' },
          { title: 'Maridaje Perfecto', description: 'Selección de vinos y bebidas para complementar tu experiencia', icon: 'wine' },
        ],
      },
    },
    {
      id: 'gallery-restaurant',
      type: 'gallery',
      settings: {
        layout: 'masonry',
        columns: 3,
        gap: '8px',
        borderRadius: '8px',
        lightbox: true,
      },
      content: {
        title: 'Nuestros Platos',
        subtitle: 'Una muestra de lo que te espera',
        images: [
          { src: '/images/dish-1.jpg', alt: 'Plato principal' },
          { src: '/images/dish-2.jpg', alt: 'Entrada gourmet' },
          { src: '/images/dish-3.jpg', alt: 'Postre artesanal' },
          { src: '/images/dish-4.jpg', alt: 'Coctel de autor' },
          { src: '/images/dish-5.jpg', alt: 'Mesa preparada' },
          { src: '/images/dish-6.jpg', alt: 'Interior del restaurante' },
        ],
      },
    },
    {
      id: 'testimonials-restaurant',
      type: 'testimonials',
      settings: {
        layout: 'cards',
        columns: 2,
        showRating: true,
        avatarStyle: 'rounded',
      },
      content: {
        title: 'Experiencias de Nuestros Comensales',
        items: [
          { name: 'Roberto Díaz', role: 'Food Blogger', text: 'Una experiencia gastronómica incomparable. Cada plato es una obra de arte.', rating: 5 },
          { name: 'Laura Sánchez', role: 'Clienta frecuente', text: 'El mejor restaurante de la ciudad. Siempre superan nuestras expectativas.', rating: 5 },
        ],
      },
    },
    {
      id: 'contact-restaurant',
      type: 'contact',
      settings: {
        layout: 'split',
        showMap: true,
        showPhone: true,
        showEmail: true,
        showAddress: true,
      },
      content: {
        title: 'Encuéntranos',
        subtitle: 'Te esperamos para ofrecerte la mejor experiencia',
      },
    },
    {
      id: 'footer-restaurant',
      type: 'footer',
      settings: {
        variant: 'full',
        backgroundColor: '#1c1917',
        textColor: '#ffffff',
        columns: 3,
      },
      content: {
        companyName: 'Restaurante Sabor',
        tagline: 'Cocina de autor desde 2010',
        copyright: '© 2026 Restaurante Sabor. Todos los derechos reservados.',
      },
    },
  ],
  theme: {
    fonts: { heading: 'Playfair Display', body: 'Lato' },
    colors: {
      primary: '#d97706',
      secondary: '#92400e',
      accent: '#dc2626',
      background: '#fffbeb',
      text: '#1c1917',
      muted: '#78716c',
    },
    spacing: { section: '96px', block: '24px', container: '1100px' },
    borderRadius: '8px',
    shadows: { sm: '0 1px 3px rgba(0,0,0,0.1)', md: '0 4px 12px rgba(0,0,0,0.08)', lg: '0 12px 32px rgba(0,0,0,0.12)' },
  },
  seo: {
    metaTitle: 'Restaurante Sabor - Cocina de Autor',
    metaDescription: 'Disfruta de la mejor experiencia gastronómica. Reserva tu mesa en Restaurante Sabor.',
    keywords: ['restaurante', 'cocina de autor', 'reservas', 'gastronomía'],
  },
  settings: {},
}
