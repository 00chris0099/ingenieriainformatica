'use client';

import { cn } from '@/lib/api';

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
  type?: 'text' | 'card' | 'table' | 'chart';
}

export default function LoadingSkeleton({ lines = 3, className, type = 'text' }: LoadingSkeletonProps) {
  if (type === 'card') {
    return (
      <div className={cn('bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse', className)}>
        <div className="h-4 bg-gray-800 rounded w-1/3 mb-3" />
        <div className="h-8 bg-gray-800 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-800 rounded w-2/3" />
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={cn('bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-pulse', className)}>
        <div className="h-12 bg-gray-800 border-b border-gray-700" />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-14 border-b border-gray-800 flex items-center px-4 gap-4">
            <div className="h-4 bg-gray-800 rounded w-1/4" />
            <div className="h-4 bg-gray-800 rounded w-1/3" />
            <div className="h-4 bg-gray-800 rounded w-1/6 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3 animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-800 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
      ))}
    </div>
  );
}
