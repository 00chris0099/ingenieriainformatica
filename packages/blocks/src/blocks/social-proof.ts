import { BlockConfig } from '../types'

export const socialProofBlock: BlockConfig = {
  id: 'social-proof',
  name: 'Social Proof',
  description: 'Real-time purchase notifications',
  category: 'social',
  icon: 'Bell',
  defaultSettings: {
    variant: 'toast',
    position: 'bottom-left',
    delay: 5000,
    duration: 5000,
    backgroundColor: '#ffffff',
    textColor: '#111827',
  },
  defaultContent: {
    messages: [
      '{name} from {city} just purchased {product}',
      '{name} from {city} is viewing this page',
      '{count} people are viewing this right now',
    ],
    names: ['John', 'Maria', 'Carlos', 'Ana', 'Luis', 'Sofia'],
    cities: ['Lima', 'Mexico City', 'Bogota', 'Santiago', 'Buenos Aires', 'Madrid'],
  },
  settingsSchema: [
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Toast', value: 'toast' },
      { label: 'Banner', value: 'banner' },
      { label: 'Popup', value: 'popup' },
    ]},
    { key: 'position', label: 'Position', type: 'select', options: [
      { label: 'Bottom Left', value: 'bottom-left' },
      { label: 'Bottom Right', value: 'bottom-right' },
      { label: 'Top Left', value: 'top-left' },
      { label: 'Top Right', value: 'top-right' },
    ]},
    { key: 'delay', label: 'Initial Delay (ms)', type: 'number' },
    { key: 'duration', label: 'Display Duration (ms)', type: 'number' },
  ],
}
