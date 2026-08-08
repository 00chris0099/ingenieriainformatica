import { BlockConfig } from '../types'

export const teamBlock: BlockConfig = {
  id: 'team',
  name: 'Equipo',
  description: 'Grid de integrantes del equipo con foto, nombre y rol',
  category: 'content',
  icon: 'Users',
  defaultSettings: {
    columns: 4,
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    paddingY: '80px',
    showPhotos: true,
  },
  defaultContent: {
    title: 'Nuestro Equipo',
    subtitle: 'Los profesionales detrás de la marca',
    items: [
      { name: 'Nombre Apellido', role: 'Cargo', photo: '' },
      { name: 'Nombre Apellido', role: 'Cargo', photo: '' },
      { name: 'Nombre Apellido', role: 'Cargo', photo: '' },
      { name: 'Nombre Apellido', role: 'Cargo', photo: '' },
    ],
  },
  settingsSchema: [
    { key: 'columns', label: 'Columnas', type: 'select', options: [
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
    ]},
    { key: 'backgroundColor', label: 'Fondo', type: 'color' },
    { key: 'textColor', label: 'Texto', type: 'color' },
    { key: 'paddingY', label: 'Padding Vertical', type: 'select', options: [
      { label: 'Small (40px)', value: '40px' },
      { label: 'Medium (80px)', value: '80px' },
      { label: 'Large (120px)', value: '120px' },
    ]},
    { key: 'title', label: 'Título', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtítulo', type: 'textarea', group: 'content' },
  ],
}
