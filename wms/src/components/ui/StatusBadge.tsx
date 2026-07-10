'use client';

import { cn } from '@/lib/api';

const variants: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-purple-500/20 text-purple-400',
  picking: 'bg-indigo-500/20 text-indigo-400',
  packing: 'bg-cyan-500/20 text-cyan-400',
  ready_to_ship: 'bg-teal-500/20 text-teal-400',
  shipped: 'bg-blue-500/20 text-blue-400',
  in_transit: 'bg-orange-500/20 text-orange-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  active: 'bg-green-500/20 text-green-400',
  draft: 'bg-gray-500/20 text-gray-400',
  archived: 'bg-gray-500/20 text-gray-400',
  paid: 'bg-green-500/20 text-green-400',
  overdue: 'bg-red-500/20 text-red-400',
  issued: 'bg-blue-500/20 text-blue-400',
  sent: 'bg-cyan-500/20 text-cyan-400',
  label_created: 'bg-blue-500/20 text-blue-400',
  low: 'bg-yellow-500/20 text-yellow-400',
  out: 'bg-red-500/20 text-red-400',
  ok: 'bg-green-500/20 text-green-400',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'text-[10px] px-2 py-0.5 rounded-full font-medium',
      variants[status] || 'bg-gray-500/20 text-gray-400',
      className
    )}>
      {label || status.replace(/_/g, ' ')}
    </span>
  );
}
