import { BlockConfig } from '../types'

export const imageBlock: BlockConfig = {
  id: 'image',
  name: 'Image',
  description: 'Single image with optional caption',
  category: 'content',
  icon: 'Image',
  defaultSettings: {
    variant: 'full',
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
    borderRadius: '0px',
    backgroundColor: 'transparent',
    paddingY: '0px',
  },
  defaultContent: {
    src: '',
    alt: 'Image description',
    caption: '',
    link: '',
  },
  settingsSchema: [
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Full Width', value: 'full' },
      { label: 'Contained', value: 'contained' },
      { label: 'With Caption', value: 'caption' },
      { label: 'Background', value: 'background' },
    ]},
    { key: 'width', label: 'Width', type: 'select', options: [
      { label: '100%', value: '100%' },
      { label: '75%', value: '75%' },
      { label: '50%', value: '50%' },
      { label: '25%', value: '25%' },
    ]},
    { key: 'objectFit', label: 'Fit', type: 'select', options: [
      { label: 'Cover', value: 'cover' },
      { label: 'Contain', value: 'contain' },
    ]},
    { key: 'borderRadius', label: 'Border Radius', type: 'select', options: [
      { label: 'None', value: '0px' },
      { label: 'Small (8px)', value: '8px' },
      { label: 'Medium (12px)', value: '12px' },
      { label: 'Large (16px)', value: '16px' },
      { label: 'Full Round', value: '9999px' },
    ]},
    { key: 'src', label: 'Image URL', type: 'image', group: 'content' },
    { key: 'alt', label: 'Alt Text', type: 'text', group: 'content' },
    { key: 'caption', label: 'Caption', type: 'text', group: 'content' },
  ],
}
