'use client';

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export default function CharacterCounter({ current, max, className = '' }: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isWarning = percentage > 80;
  const isError = percentage > 100;

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-200 ${
            isError ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-brand-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={`font-mono ${isError ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-gray-500'}`}>
        {current}/{max}
      </span>
    </div>
  );
}
