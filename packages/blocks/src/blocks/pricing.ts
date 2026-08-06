import { BlockConfig } from '../types'

export const pricingBlock: BlockConfig = {
  id: 'pricing',
  name: 'Pricing Table',
  description: 'Pricing plans comparison table',
  category: 'commerce',
  icon: 'CreditCard',
  defaultSettings: {
    variant: 'cards',
    columns: 3,
    showToggle: false,
    highlightedPlan: 'pro',
    backgroundColor: '#ffffff',
    paddingY: '80px',
  },
  defaultContent: {
    title: 'Simple, Transparent Pricing',
    subtitle: 'Choose the plan that works for you.',
    monthlyLabel: 'Monthly',
    yearlyLabel: 'Yearly',
    items: [
      { name: 'Starter', price: 9, period: 'month', description: 'Perfect for small teams', features: ['5 Projects', '10GB Storage', 'Basic Analytics', 'Email Support'], cta: 'Get Started', highlighted: false },
      { name: 'Pro', price: 29, period: 'month', description: 'Best for growing businesses', features: ['Unlimited Projects', '100GB Storage', 'Advanced Analytics', 'Priority Support', 'Custom Domain', 'API Access'], cta: 'Start Free Trial', highlighted: true },
      { name: 'Enterprise', price: 99, period: 'month', description: 'For large organizations', features: ['Everything in Pro', 'Unlimited Storage', 'Dedicated Manager', 'SLA Guarantee', 'Custom Integrations', 'White Label'], cta: 'Contact Sales', highlighted: false },
    ],
  },
  settingsSchema: [
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Cards', value: 'cards' },
      { label: 'Table', value: 'table' },
      { label: 'Minimal', value: 'minimal' },
    ]},
    { key: 'highlightedPlan', label: 'Highlighted Plan', type: 'select', options: [
      { label: 'None', value: 'none' },
      { label: 'First', value: 'first' },
      { label: 'Second', value: 'second' },
      { label: 'Third', value: 'third' },
    ]},
    { key: 'showToggle', label: 'Show Monthly/Yearly Toggle', type: 'toggle' },
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
