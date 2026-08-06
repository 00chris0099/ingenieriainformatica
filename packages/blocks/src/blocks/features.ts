import { BlockConfig } from '../types'

export const featuresBlock: BlockConfig = {
  id: 'features',
  name: 'Features Grid',
  description: 'Grid of feature cards with icons',
  category: 'content',
  icon: 'Grid3x3',
  defaultSettings: {
    columns: 3,
    variant: 'card',
    showIcons: true,
    iconStyle: 'circle',
    backgroundColor: '#ffffff',
    textAlign: 'center',
    paddingY: '80px',
  },
  defaultContent: {
    title: 'Why Choose Us',
    subtitle: 'We provide the best solutions for your business.',
    items: [
      { icon: 'Zap', title: 'Lightning Fast', description: 'Optimized for speed and performance.' },
      { icon: 'Shield', title: 'Secure', description: 'Enterprise-grade security built in.' },
      { icon: 'Heart', title: 'User Friendly', description: 'Intuitive interface your users will love.' },
    ],
  },
  settingsSchema: [
    { key: 'columns', label: 'Columns', type: 'select', options: [
      { label: '2 Columns', value: '2' },
      { label: '3 Columns', value: '3' },
      { label: '4 Columns', value: '4' },
    ]},
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Card', value: 'card' },
      { label: 'Minimal', value: 'minimal' },
      { label: 'Bordered', value: 'bordered' },
    ]},
    { key: 'showIcons', label: 'Show Icons', type: 'toggle' },
    { key: 'textAlign', label: 'Text Alignment', type: 'select', options: [
      { label: 'Center', value: 'center' },
      { label: 'Left', value: 'left' },
    ]},
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'paddingY', label: 'Vertical Padding', type: 'select', options: [
      { label: 'Small (40px)', value: '40px' },
      { label: 'Medium (80px)', value: '80px' },
      { label: 'Large (120px)', value: '120px' },
    ]},
    { key: 'title', label: 'Section Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Section Subtitle', type: 'textarea', group: 'content' },
  ],
}
