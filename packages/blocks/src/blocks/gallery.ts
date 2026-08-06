import { BlockConfig } from '../types'

export const galleryBlock: BlockConfig = {
  id: 'gallery',
  name: 'Gallery',
  description: 'Image gallery grid',
  category: 'content',
  icon: 'Images',
  defaultSettings: {
    columns: 3,
    gap: '16px',
    variant: 'grid',
    showCaptions: false,
    lightbox: true,
    backgroundColor: '#ffffff',
    paddingY: '80px',
  },
  defaultContent: {
    title: 'Our Gallery',
    subtitle: 'A visual showcase of our work.',
    images: [
      { src: '', alt: 'Gallery image 1', caption: '' },
      { src: '', alt: 'Gallery image 2', caption: '' },
      { src: '', alt: 'Gallery image 3', caption: '' },
      { src: '', alt: 'Gallery image 4', caption: '' },
      { src: '', alt: 'Gallery image 5', caption: '' },
      { src: '', alt: 'Gallery image 6', caption: '' },
    ],
  },
  settingsSchema: [
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Grid', value: 'grid' },
      { label: 'Masonry', value: 'masonry' },
      { label: 'Carousel', value: 'carousel' },
    ]},
    { key: 'columns', label: 'Columns', type: 'select', options: [
      { label: '2 Columns', value: '2' },
      { label: '3 Columns', value: '3' },
      { label: '4 Columns', value: '4' },
    ]},
    { key: 'gap', label: 'Gap', type: 'select', options: [
      { label: 'Small (8px)', value: '8px' },
      { label: 'Medium (16px)', value: '16px' },
      { label: 'Large (24px)', value: '24px' },
    ]},
    { key: 'showCaptions', label: 'Show Captions', type: 'toggle' },
    { key: 'lightbox', label: 'Enable Lightbox', type: 'toggle' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'title', label: 'Section Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Section Subtitle', type: 'textarea', group: 'content' },
  ],
}
