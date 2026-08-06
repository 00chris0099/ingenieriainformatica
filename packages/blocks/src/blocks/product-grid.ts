import { BlockConfig } from '../types'

export const productGridBlock: BlockConfig = {
  id: 'product-grid',
  name: 'Product Grid',
  description: 'Grid of product cards from your catalog',
  category: 'commerce',
  icon: 'ShoppingBag',
  defaultSettings: {
    columns: 4,
    source: 'featured',
    showPrices: true,
    showDiscount: true,
    showRating: false,
    backgroundColor: '#ffffff',
    paddingY: '80px',
  },
  defaultContent: {
    title: 'Featured Products',
    subtitle: 'Discover our most popular items.',
    emptyText: 'No products found.',
  },
  settingsSchema: [
    { key: 'columns', label: 'Columns', type: 'select', options: [
      { label: '2 Columns', value: '2' },
      { label: '3 Columns', value: '3' },
      { label: '4 Columns', value: '4' },
    ]},
    { key: 'source', label: 'Product Source', type: 'select', options: [
      { label: 'Featured', value: 'featured' },
      { label: 'Latest', value: 'latest' },
      { label: 'Best Sellers', value: 'bestsellers' },
      { label: 'On Sale', value: 'sale' },
      { label: 'Custom Selection', value: 'custom' },
    ]},
    { key: 'showPrices', label: 'Show Prices', type: 'toggle' },
    { key: 'showDiscount', label: 'Show Discount Badge', type: 'toggle' },
    { key: 'showRating', label: 'Show Rating', type: 'toggle' },
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
