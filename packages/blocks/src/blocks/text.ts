import { BlockConfig } from '../types'

export const textBlock: BlockConfig = {
  id: 'text',
  name: 'Text Block',
  description: 'Rich text content block',
  category: 'content',
  icon: 'Type',
  defaultSettings: {
    variant: 'paragraph',
    textAlign: 'left',
    maxWidth: '800px',
    backgroundColor: 'transparent',
    paddingY: '40px',
  },
  defaultContent: {
    title: '',
    text: 'Write your content here. You can use **bold**, *italic*, and other formatting.',
  },
  settingsSchema: [
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Paragraph', value: 'paragraph' },
      { label: 'Heading + Text', value: 'heading-text' },
      { label: 'Quote', value: 'quote' },
    ]},
    { key: 'textAlign', label: 'Text Alignment', type: 'select', options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
    ]},
    { key: 'maxWidth', label: 'Max Width', type: 'select', options: [
      { label: 'Narrow (600px)', value: '600px' },
      { label: 'Medium (800px)', value: '800px' },
      { label: 'Wide (1000px)', value: '1000px' },
      { label: 'Full Width', value: '100%' },
    ]},
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'title', label: 'Title', type: 'text', group: 'content' },
    { key: 'text', label: 'Content', type: 'textarea', group: 'content' },
  ],
}
