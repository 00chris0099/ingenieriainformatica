'use client'

import { Block, ThemeConfig } from '@repo/blocks'
import {
  Truck, Shield, RefreshCw, Star, Heart, Gift, Check, Clock,
  Phone, Mail, Award, Monitor, Users, Zap, Code, Sparkles,
  Palette, TrendingUp, Headphones, Leaf, Wine, ChefHat, Calendar,
  Dumbbell, Play, Lightbulb, Puzzle, type LucideIcon,
} from 'lucide-react'

interface Props { block: Block; theme?: ThemeConfig }

const iconMap: Record<string, LucideIcon> = {
  truck: Truck, shield: Shield, refresh: RefreshCw, star: Star,
  heart: Heart, gift: Gift, check: Check, clock: Clock,
  phone: Phone, mail: Mail, award: Award, monitor: Monitor,
  users: Users, zap: Zap, code: Code, sparkles: Sparkles,
  palette: Palette, trending: TrendingUp, headphones: Headphones,
  leaf: Leaf, wine: Wine, 'chef-hat': ChefHat, calendar: Calendar,
  dumbbell: Dumbbell, play: Play, lightbulb: Lightbulb, puzzle: Puzzle,
}

export default function FeaturesBlock({ block, theme }: Props) {
  const { content } = block
  const columns = block.settings.columns || 3
  const items = content.items || []

  return (
    <section className="py-16 px-6" style={{ backgroundColor: theme?.colors?.background || '#ffffff' }}>
      <div className="max-w-6xl mx-auto">
        {content.title && (
          <h2 className="text-3xl font-bold text-center mb-4" style={{ color: theme?.colors?.text || '#111827' }}>
            {content.title}
          </h2>
        )}
        {content.subtitle && (
          <p className="text-center mb-12" style={{ color: theme?.colors?.muted || '#6b7280' }}>
            {content.subtitle}
          </p>
        )}
        <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {items.map((item: any, i: number) => {
            const Icon = item.icon ? iconMap[item.icon] : null
            return (
              <div key={i} className="text-center p-6 rounded-xl" style={{ backgroundColor: theme?.colors?.background || '#f9fafb' }}>
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${theme?.colors?.primary || '#2563eb'}15`, color: theme?.colors?.primary || '#2563eb' }}
                >
                  {Icon ? <Icon size={24} /> : <Check size={24} />}
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme?.colors?.text || '#111827' }}>
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: theme?.colors?.muted || '#6b7280' }}>
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
