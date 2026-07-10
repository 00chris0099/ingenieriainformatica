'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/api';

interface StatsCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  href?: string;
  change?: string;
  changeUp?: boolean;
  className?: string;
}

export default function StatsCard({ label, value, subtitle, icon: Icon, color = 'text-brand-400', href, change, changeUp, className }: StatsCardProps) {
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'bg-gray-900 border border-gray-800 rounded-xl p-4 transition-colors',
        href && 'hover:border-gray-700 group cursor-pointer',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <Icon size={18} className={color} />
      </div>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      {subtitle && <p className="text-[10px] text-gray-500 mt-1">{subtitle}</p>}
      {change && (
        <p className={cn('text-xs mt-1', changeUp ? 'text-green-400' : 'text-red-400')}>{change}</p>
      )}
    </Wrapper>
  );
}
