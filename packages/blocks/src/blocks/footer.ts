import { BlockConfig } from '../types'

export const footerBlock: BlockConfig = {
  id: 'footer',
  name: 'Footer',
  description: 'Site footer with links and branding',
  category: 'layout',
  icon: 'PanelBottom',
  defaultSettings: {
    variant: 'standard',
    backgroundColor: '#111827',
    textColor: '#ffffff',
    columns: 4,
    showLogo: true,
    showSocial: true,
    showNewsletter: false,
    paddingY: '60px',
  },
  defaultContent: {
    companyName: 'Your Company',
    tagline: 'Building the future, one step at a time.',
    columns: [
      { title: 'Product', links: [{ label: 'Features', url: '#' }, { label: 'Pricing', url: '#' }, { label: 'Changelog', url: '#' }] },
      { title: 'Company', links: [{ label: 'About', url: '#' }, { label: 'Blog', url: '#' }, { label: 'Careers', url: '#' }] },
      { title: 'Support', links: [{ label: 'Help Center', url: '#' }, { label: 'Contact', url: '#' }, { label: 'Status', url: '#' }] },
      { title: 'Legal', links: [{ label: 'Privacy', url: '#' }, { label: 'Terms', url: '#' }, { label: 'Cookies', url: '#' }] },
    ],
    socialLinks: [
      { platform: 'twitter', url: '#' },
      { platform: 'github', url: '#' },
      { platform: 'linkedin', url: '#' },
    ],
    copyright: '© 2024 Your Company. All rights reserved.',
  },
  settingsSchema: [
    { key: 'variant', label: 'Variant', type: 'select', options: [
      { label: 'Standard', value: 'standard' },
      { label: 'Minimal', value: 'minimal' },
      { label: 'Centered', value: 'centered' },
    ]},
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'textColor', label: 'Text Color', type: 'color' },
    { key: 'showLogo', label: 'Show Logo', type: 'toggle' },
    { key: 'showSocial', label: 'Show Social Links', type: 'toggle' },
    { key: 'copyright', label: 'Copyright Text', type: 'text', group: 'content' },
  ],
}
