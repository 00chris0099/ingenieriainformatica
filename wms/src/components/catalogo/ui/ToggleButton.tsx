'use client';

import { Plus, X } from 'lucide-react';

interface ToggleButtonProps {
  label: string;
  isActive: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning';
}

export default function ToggleButton({ label, isActive, onToggle, icon, variant = 'default' }: ToggleButtonProps) {
  const variants = {
    default: isActive
      ? 'bg-brand-600 text-white border-brand-500'
      : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600',
    success: isActive
      ? 'bg-green-600 text-white border-green-500'
      : 'bg-gray-800 text-green-400 border-gray-700 hover:border-green-600',
    warning: isActive
      ? 'bg-amber-600 text-white border-amber-500'
      : 'bg-gray-800 text-amber-400 border-gray-700 hover:border-amber-600',
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${variants[variant]}`}
    >
      {icon || (isActive ? <X size={14} /> : <Plus size={14} />)}
      {label}
    </button>
  );
}
