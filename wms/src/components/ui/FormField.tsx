'use client';

import { cn } from '@/lib/api';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function FormField({ label, error, hint, required, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-medium text-gray-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function FormInput({ label, error, hint, className, required, ...props }: InputProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <input
        className={cn(
          'w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all',
          error ? 'border-red-500' : 'border-gray-700',
          className
        )}
        {...props}
      />
    </FormField>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function FormSelect({ label, error, options, className, required, ...props }: SelectProps) {
  return (
    <FormField label={label} error={error} required={required}>
      <select
        className={cn(
          'w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all',
          error ? 'border-red-500' : 'border-gray-700',
          className
        )}
        {...props}
      >
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </FormField>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function FormTextarea({ label, error, hint, className, required, ...props }: TextareaProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <textarea
        className={cn(
          'w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none transition-all',
          error ? 'border-red-500' : 'border-gray-700',
          className
        )}
        rows={3}
        {...props}
      />
    </FormField>
  );
}
