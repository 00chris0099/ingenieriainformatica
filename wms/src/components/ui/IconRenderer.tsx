import React from 'react'
import {
  Shirt, Sparkles, Footprints, Baby, ShieldCheck, Palette, Leaf, Truck,
  RefreshCw, Headphones, Watch, Zap, Wine, Utensils, Gift, ShoppingBag,
  Home, MessageSquare, Flame, CheckCircle2, Star, Cpu, ArrowRight, X, ChevronRight, Sliders
} from 'lucide-react'

const iconMap: Record<string, React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  Shirt, Sparkles, Footprints, Baby, ShieldCheck, Palette, Leaf, Truck,
  RefreshCw, Headphones, Watch, Zap, Wine, Utensils, Gift, ShoppingBag,
  Home, MessageSquare, Flame, CheckCircle2, Star, Cpu, ArrowRight, X, ChevronRight, Sliders
}

export function IconRenderer({ name, size = 20, className = '', style }: { name?: string; size?: number; className?: string; style?: React.CSSProperties }) {
  if (!name) return <ShoppingBag size={size} className={className} style={style} />
  const IconComponent = iconMap[name] || ShoppingBag
  return <IconComponent size={size} className={className} style={style} />
}

export function getSvgString(name?: string, color = '#f43f5e', size = 24): string {
  // Pure inline SVG string generator for iframe canvas preview
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`
}
