import { BlockConfig } from '../types'

export const columnsBlock: BlockConfig = {
  id: 'columns',
  name: 'Columns',
  description: 'Multi-column layout container',
  category: 'layout',
  icon: 'Columns3',
  defaultSettings: {
    columns: 2,
    gap: '32px',
    verticalAlign: 'top',
    backgroundColor: 'transparent',
    paddingY: '40px',
  },
  defaultContent: {
    items: [
      { width: '50%', blocks: [] },
      { width: '50%', blocks: [] },
    ],
  },
  settingsSchema: [
    { key: 'columns', label: 'Number of Columns', type: 'select', options: [
      { label: '2 Columns', value: '2' },
      { label: '3 Columns', value: '3' },
      { label: '4 Columns', value: '4' },
    ]},
    { key: 'gap', label: 'Gap', type: 'select', options: [
      { label: 'Small (16px)', value: '16px' },
      { label: 'Medium (32px)', value: '32px' },
      { label: 'Large (48px)', value: '48px' },
    ]},
    { key: 'verticalAlign', label: 'Vertical Alignment', type: 'select', options: [
      { label: 'Top', value: 'top' },
      { label: 'Center', value: 'center' },
      { label: 'Bottom', value: 'bottom' },
    ]},
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
  ],
}
