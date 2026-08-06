import { BlockConfig } from '../types'

export const testimonialsBlock: BlockConfig = {
  id: 'testimonials',
  name: 'Testimonials',
  description: 'Customer reviews and testimonials',
  category: 'social',
  icon: 'Quote',
  defaultSettings: {
    variant: 'carousel',
    columns: 3,
    showRating: true,
    showAvatar: true,
    backgroundColor: '#f9fafb',
    paddingY: '80px',
  },
  defaultContent: {
    title: 'What Our Customers Say',
    subtitle: 'Trusted by thousands of businesses worldwide.',
    items: [
      { name: 'Sarah Johnson', role: 'CEO, TechCorp', avatar: '', rating: 5, text: 'Amazing product! It transformed our business completely.' },
      { name: 'Mike Chen', role: 'Founder, StartupXYZ', avatar: '', rating: 5, text: 'Best investment we made this year. Highly recommended!' },
      { name: 'Emily Davis', role: 'Marketing Dir, BigCo', avatar: '', rating: 5, text: 'The team is incredible. Support is always available.' },
    ],
  },
  settingsSchema: [
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Carousel', value: 'carousel' },
      { label: 'Grid', value: 'grid' },
      { label: 'Single Featured', value: 'featured' },
    ]},
    { key: 'columns', label: 'Columns', type: 'select', options: [
      { label: '2 Columns', value: '2' },
      { label: '3 Columns', value: '3' },
    ]},
    { key: 'showRating', label: 'Show Rating', type: 'toggle' },
    { key: 'showAvatar', label: 'Show Avatar', type: 'toggle' },
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
