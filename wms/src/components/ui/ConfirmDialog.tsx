'use client';

import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/api';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'danger' }: ConfirmDialogProps) {
  if (!open) return null;

  const variantColors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-brand-600 hover:bg-brand-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
        <div className="flex items-center gap-3 mb-4">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', variant === 'danger' ? 'bg-red-500/20' : variant === 'warning' ? 'bg-yellow-500/20' : 'bg-brand-500/20')}>
            <AlertTriangle size={20} className={variant === 'danger' ? 'text-red-400' : variant === 'warning' ? 'text-yellow-400' : 'text-brand-400'} />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">{cancelLabel}</button>
          <button onClick={onConfirm} className={cn('px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors', variantColors[variant])}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
