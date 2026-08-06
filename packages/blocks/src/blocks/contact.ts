import { BlockConfig } from '../types'

export const contactBlock: BlockConfig = {
  id: 'contact',
  name: 'Contact Form',
  description: 'Contact form with fields',
  category: 'social',
  icon: 'MessageSquare',
  defaultSettings: {
    variant: 'split',
    showMap: false,
    showPhone: true,
    showEmail: true,
    showAddress: true,
    backgroundColor: '#ffffff',
    paddingY: '80px',
  },
  defaultContent: {
    title: 'Get in Touch',
    subtitle: 'We would love to hear from you.',
    phone: '+1 (555) 123-4567',
    email: 'hello@example.com',
    address: '123 Main St, City, Country',
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'tel', required: false },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
    ],
    buttonText: 'Send Message',
  },
  settingsSchema: [
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Split (Form + Info)', value: 'split' },
      { label: 'Form Only', value: 'form-only' },
      { label: 'Info Only', value: 'info-only' },
    ]},
    { key: 'showMap', label: 'Show Map', type: 'toggle' },
    { key: 'showPhone', label: 'Show Phone', type: 'toggle' },
    { key: 'showEmail', label: 'Show Email', type: 'toggle' },
    { key: 'showAddress', label: 'Show Address', type: 'toggle' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'title', label: 'Section Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Section Subtitle', type: 'textarea', group: 'content' },
  ],
}
