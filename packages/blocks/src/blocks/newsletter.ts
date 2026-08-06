import { BlockConfig } from '../types'

export const newsletterBlock: BlockConfig = {
  id: 'newsletter',
  name: 'Newsletter Signup',
  description: 'Email newsletter subscription form',
  category: 'social',
  icon: 'Mail',
  defaultSettings: {
    variant: 'inline',
    backgroundColor: '#f3f4f6',
    textColor: '#111827',
    buttonColor: '#2563eb',
    paddingY: '60px',
  },
  defaultContent: {
    title: 'Stay Updated',
    subtitle: 'Get the latest news and updates delivered to your inbox.',
    placeholder: 'Enter your email',
    buttonText: 'Subscribe',
    privacyText: 'We respect your privacy. Unsubscribe at any time.',
  },
  settingsSchema: [
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Inline Form', value: 'inline' },
      { label: 'Card', value: 'card' },
      { label: 'Split (Text + Form)', value: 'split' },
    ]},
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'textColor', label: 'Text Color', type: 'color' },
    { key: 'buttonColor', label: 'Button Color', type: 'color' },
    { key: 'paddingY', label: 'Vertical Padding', type: 'select', options: [
      { label: 'Small (40px)', value: '40px' },
      { label: 'Medium (60px)', value: '60px' },
      { label: 'Large (80px)', value: '80px' },
    ]},
    { key: 'title', label: 'Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea', group: 'content' },
    { key: 'placeholder', label: 'Input Placeholder', type: 'text', group: 'content' },
    { key: 'buttonText', label: 'Button Text', type: 'text', group: 'content' },
  ],
}
