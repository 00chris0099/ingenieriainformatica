import { BlockConfig } from '../types'

export const faqBlock: BlockConfig = {
  id: 'faq',
  name: 'FAQ',
  description: 'Frequently asked questions accordion',
  category: 'content',
  icon: 'HelpCircle',
  defaultSettings: {
    variant: 'accordion',
    columns: 1,
    showIcons: true,
    backgroundColor: '#ffffff',
    paddingY: '80px',
  },
  defaultContent: {
    title: 'Frequently Asked Questions',
    subtitle: 'Everything you need to know.',
    items: [
      { question: 'How does it work?', answer: 'Simply sign up, configure your settings, and you are ready to go. Our intuitive interface makes it easy.' },
      { question: 'What pricing plans do you offer?', answer: 'We offer flexible plans for businesses of all sizes. Contact us for a custom quote.' },
      { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel your subscription at any time with no penalties.' },
      { question: 'Do you offer support?', answer: 'Yes, we offer 24/7 support via email, chat, and phone for all plans.' },
    ],
  },
  settingsSchema: [
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Accordion', value: 'accordion' },
      { label: 'Two Columns', value: 'two-columns' },
      { label: 'Tabs', value: 'tabs' },
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
