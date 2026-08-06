import { BlockConfig } from '../types'

export const accordionBlock: BlockConfig = {
  id: 'accordion',
  name: 'Accordion',
  description: 'Expandable content sections',
  category: 'content',
  icon: 'ChevronDown',
  defaultSettings: {
    variant: 'default',
    multiple: false,
    backgroundColor: '#ffffff',
    paddingY: '60px',
  },
  defaultContent: {
    title: 'More Information',
    items: [
      { title: 'Section 1', content: 'Content for the first section goes here.' },
      { title: 'Section 2', content: 'Content for the second section goes here.' },
      { title: 'Section 3', content: 'Content for the third section goes here.' },
    ],
  },
  settingsSchema: [
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Default', value: 'default' },
      { label: 'Bordered', value: 'bordered' },
      { label: 'Filled', value: 'filled' },
    ]},
    { key: 'multiple', label: 'Allow Multiple Open', type: 'toggle' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'title', label: 'Section Title', type: 'text', group: 'content' },
  ],
}
