import { BlockConfig } from '../types'

export const calendarBlock: BlockConfig = {
  id: 'calendar',
  name: 'Calendario de Citas',
  description: 'Agenda de citas con selector de fecha y hora (Landing de alta conversión)',
  category: 'content',
  icon: 'CalendarDays',
  defaultSettings: {
    backgroundColor: '#0f172a',
    accentColor: '#f59e0b',
    textColor: '#ffffff',
    columns: 2,
  },
  defaultContent: {
    title: 'Agenda tu sesión gratuita',
    subtitle: 'Elige el día y la hora que mejor te convenga. Confirmamos al instante.',
    buttonLabel: 'Confirmar reserva',
    integration: 'internal', // internal | calendly | google
    bookingUrl: '',
    whatsappNumber: '',
    notificationEmail: '',
    notificationWhatsapp: '',
    duration: '30',
    hours: ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00'],
    note: 'Sesión de 30 minutos · Sin compromiso',
  },
  settingsSchema: [
    { key: 'title', label: 'Título', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtítulo', type: 'textarea', group: 'content' },
    { key: 'buttonLabel', label: 'Texto del botón', type: 'text', group: 'content' },
    { key: 'integration', label: 'Integración de agenda', type: 'select', group: 'content', options: [
      { label: 'Agenda interna (slots en la BD de la tienda)', value: 'internal' },
      { label: 'Calendly (embed externo)', value: 'calendly' },
      { label: 'Google Calendar (reserva interna + enlace al evento)', value: 'google' },
    ]},
    { key: 'bookingUrl', label: 'URL de Calendly (si integración = Calendly)', type: 'text', group: 'content', placeholder: 'https://calendly.com/tu-usuario' },
    { key: 'duration', label: 'Duración (minutos)', type: 'select', group: 'content', options: [
      { label: '15 min', value: '15' },
      { label: '30 min', value: '30' },
      { label: '45 min', value: '45' },
      { label: '60 min', value: '60' },
      { label: '90 min', value: '90' },
    ]},
    { key: 'notificationEmail', label: 'Email de notificación (vacío = dueños de la tienda)', type: 'text', group: 'content', placeholder: 'ventas@mitienda.com' },
    { key: 'notificationWhatsapp', label: 'WhatsApp de notificación (vacío = número del bloque)', type: 'text', group: 'content', placeholder: '51999999999' },
    { key: 'whatsappNumber', label: 'WhatsApp de la tienda (contacto)', type: 'text', group: 'content', placeholder: '51999999999' },
    { key: 'note', label: 'Nota al pie', type: 'text', group: 'content' },
    { key: 'backgroundColor', label: 'Fondo', type: 'color' },
    { key: 'accentColor', label: 'Color de acento', type: 'color' },
    { key: 'textColor', label: 'Color de texto', type: 'color' },
    { key: 'columns', label: 'Columnas de horas', type: 'select', options: [
      { label: '2', value: '2' },
      { label: '3', value: '3' },
    ]},
  ],
  aiPrompt: 'Genera una sección de agenda de citas para una landing page de alta conversión con título, subtítulo y horarios disponibles.',
}
