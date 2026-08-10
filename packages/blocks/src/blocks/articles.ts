import { BlockConfig } from '../types'

export const articlesBlock: BlockConfig = {
  id: 'articles',
  name: 'Artículos / Blog',
  description: 'Blog corporativo con artículos para SEO (Página corporativa)',
  category: 'seo',
  icon: 'Newspaper',
  defaultSettings: {
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    accentColor: '#2563eb',
    columns: 3,
    showDate: true,
    showReadMore: true,
  },
  defaultContent: {
    source: 'static', // 'static' = artículos manuales | 'blog' = posts reales del gestor de blog
    title: 'Últimas publicaciones',
    subtitle: 'Conocimiento, novedades y guías de nuestra empresa',
    articles: [
      {
        id: 'a1',
        title: 'Cómo elegir el proveedor ideal para tu negocio',
        excerpt: 'Guía completa con los 7 criterios clave que debes evaluar antes de firmar un contrato de suministro.',
        date: '2026-07-20',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&auto=format&fit=crop',
        link: '#',
        tag: 'Guías',
      },
      {
        id: 'a2',
        title: '5 tendencias del mercado para este año',
        excerpt: 'Analizamos los datos y las señales que definirán la demanda en los próximos meses.',
        date: '2026-06-12',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop',
        link: '#',
        tag: 'Mercado',
      },
      {
        id: 'a3',
        title: 'Casos de éxito: cómo duplicamos ventas en 90 días',
        excerpt: 'La historia detrás de una transformación comercial completa, paso a paso.',
        date: '2026-05-03',
        imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&auto=format&fit=crop',
        link: '#',
        tag: 'Casos',
      },
    ],
  },
  settingsSchema: [
    { key: 'title', label: 'Título', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtítulo', type: 'textarea', group: 'content' },
    { key: 'source', label: 'Fuente de artículos', type: 'select', group: 'content', options: [
      { label: 'Posts reales del blog (gestor de blog)', value: 'blog' },
      { label: 'Artículos manuales (editor)', value: 'static' },
    ]},
    { key: 'backgroundColor', label: 'Fondo', type: 'color' },
    { key: 'textColor', label: 'Color de texto', type: 'color' },
    { key: 'accentColor', label: 'Color de acento', type: 'color' },
    { key: 'columns', label: 'Columnas', type: 'select', options: [
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
    ]},
    { key: 'showDate', label: 'Mostrar fecha', type: 'toggle' },
    { key: 'showReadMore', label: 'Mostrar "Leer más"', type: 'toggle' },
  ],
  aiPrompt: 'Genera una sección de blog corporativo con 3 artículos optimizados para SEO.',
}
