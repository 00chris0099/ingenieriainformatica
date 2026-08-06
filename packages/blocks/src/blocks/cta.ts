import { BlockConfig } from '../types'

export const ctaBlock: BlockConfig = {
  id: 'cta',
  name: 'Call to Action',
  description: 'Conversion-focused CTA section',
  category: 'content',
  icon: 'MousePointerClick',
  defaultSettings: {
    variant: 'gradient',
    backgroundColor: '#2563eb',
    gradientFrom: '#2563eb',
    gradientTo: '#7c3aed',
    textColor: '#ffffff',
    textAlign: 'center',
    paddingY: '80px',
    borderRadius: '0px',
  },
  defaultContent: {
    title: 'Ready to Get Started?',
    subtitle: 'Join thousands of satisfied customers today.',
    buttonText: 'Start Free Trial',
    buttonLink: '#',
    buttonVariant: 'white',
  },
  settingsSchema: [
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Gradient', value: 'gradient' },
      { label: 'Solid Color', value: 'solid' },
      { label: 'Bordered', value: 'bordered' },
      { label: 'Minimal', value: 'minimal' },
    ]},
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'gradientFrom', label: 'Gradient Start', type: 'color' },
    { key: 'gradientTo', label: 'Gradient End', type: 'color' },
    { key: 'textColor', label: 'Text Color', type: 'color' },
    { key: 'textAlign', label: 'Text Alignment', type: 'select', options: [
      { label: 'Center', value: 'center' },
      { label: 'Left', value: 'left' },
    ]},
    { key: 'paddingY', label: 'Vertical Padding', type: 'select', options: [
      { label: 'Small (40px)', value: '40px' },
      { label: 'Medium (80px)', value: '80px' },
      { label: 'Large (120px)', value: '120px' },
    ]},
    { key: 'title', label: 'Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea', group: 'content' },
    { key: 'buttonText', label: 'Button Text', type: 'text', group: 'content' },
    { key: 'buttonLink', label: 'Button Link', type: 'link', group: 'content' },
  ],
}
