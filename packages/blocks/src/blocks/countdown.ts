import { BlockConfig } from '../types'

export const countdownBlock: BlockConfig = {
  id: 'countdown',
  name: 'Countdown Timer',
  description: 'Urgency countdown timer',
  category: 'content',
  icon: 'Timer',
  defaultSettings: {
    variant: 'inline',
    backgroundColor: '#dc2626',
    textColor: '#ffffff',
    paddingY: '40px',
  },
  defaultContent: {
    title: 'Limited Time Offer!',
    subtitle: 'Hurry up! This offer ends in:',
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    urgencyText: 'Don\'t miss out!',
  },
  settingsSchema: [
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Inline', value: 'inline' },
      { label: 'Card', value: 'card' },
      { label: 'Banner', value: 'banner' },
    ]},
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'textColor', label: 'Text Color', type: 'color' },
    { key: 'title', label: 'Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', group: 'content' },
    { key: 'endDate', label: 'End Date', type: 'text', group: 'content' },
  ],
}
