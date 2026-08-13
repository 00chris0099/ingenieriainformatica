import { BlockConfig } from '../types'

export const navbarBlock: BlockConfig = {
  id: 'navbar',
  name: 'Barra de Navegación',
  description: 'Navbar sticky adaptable con enlaces por ventana, menú móvil y carrito',
  category: 'layout',
  icon: 'Menu',
  defaultSettings: {
    backgroundColor: '#ffffff',
    textColor: '#111827',
    accentColor: '#f43f5e',
    sticky: true,
  },
  defaultContent: {
    announcement: '¡ENVÍO GRATIS EN COMPRAS MAYORES A S/ 120!',
    brandName: 'TIENDA VIRTUAL',
    logoUrl: '',
    links: [
      { label: 'Inicio', windowId: 'home', iconName: 'Home' },
      { label: 'Catálogo', windowId: 'productos', iconName: 'ShoppingBag' },
    ],
  },
  settingsSchema: [
    { key: 'backgroundColor', label: 'Fondo', type: 'color' },
    { key: 'textColor', label: 'Texto', type: 'color' },
    { key: 'accentColor', label: 'Color de Acento', type: 'color' },
    { key: 'sticky', label: 'Fijo al Scroll', type: 'toggle' },
    { key: 'announcement', label: 'Barra de Anuncios', type: 'textarea', group: 'content' },
    { key: 'brandName', label: 'Nombre de Marca', type: 'text', group: 'content' },
    { key: 'logoUrl', label: 'Logo (URL o subida)', type: 'image', group: 'content' },
  ],
}
