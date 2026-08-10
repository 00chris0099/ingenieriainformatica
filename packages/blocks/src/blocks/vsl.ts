import { BlockConfig } from '../types'

export const vslBlock: BlockConfig = {
  id: 'vsl',
  name: 'Video VSL',
  description: 'Video Sales Letter con autoplay, thumbnails y CTA (Landing)',
  category: 'content',
  icon: 'Video',
  defaultSettings: {
    backgroundColor: '#0f172a',
    accentColor: '#f43f5e',
    textColor: '#ffffff',
    autoplay: false,
    rounded: '16px',
  },
  defaultContent: {
    headline: 'Mira este video de 5 minutos',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '',
    ctaText: 'Quiero empezar ahora',
    ctaUrl: '#cta',
    badge: '▶ Video explicativo',
  },
  settingsSchema: [
    { key: 'headline', label: 'Título', type: 'text', group: 'content' },
    { key: 'badge', label: 'Etiqueta superior', type: 'text', group: 'content' },
    { key: 'videoUrl', label: 'URL del video (YouTube/Vimeo/MP4)', type: 'text', group: 'content', placeholder: 'https://www.youtube.com/watch?v=...' },
    { key: 'thumbnailUrl', label: 'Imagen de portada', type: 'image', group: 'content' },
    { key: 'ctaText', label: 'Texto del botón', type: 'text', group: 'content' },
    { key: 'ctaUrl', label: 'Destino del botón', type: 'link', group: 'content' },
    { key: 'backgroundColor', label: 'Fondo', type: 'color' },
    { key: 'accentColor', label: 'Color de acento', type: 'color' },
    { key: 'textColor', label: 'Color de texto', type: 'color' },
    { key: 'autoplay', label: 'Autoplay', type: 'toggle' },
    { key: 'rounded', label: 'Esquinas', type: 'select', options: [
      { label: 'Redondeadas', value: '16px' },
      { label: 'Muy redondeadas', value: '28px' },
      { label: 'Rectas', value: '0px' },
    ]},
  ],
  aiPrompt: 'Genera una sección VSL (video sales letter) con titular persuasivo y CTA claro para una landing page.',
}
