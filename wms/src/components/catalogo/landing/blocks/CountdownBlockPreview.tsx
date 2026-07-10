'use client';

import { useState, useEffect } from 'react';

interface CountdownBlockPreviewProps {
  content: Record<string, any>;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownBlockPreview({ content }: CountdownBlockPreviewProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!content.endDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

      const difference = new Date(content.endDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [content.endDate]);

  const pad = (num: number) => String(num).padStart(2, '0');

  return (
    <div
      className="p-6 rounded-lg text-center"
      style={{ backgroundColor: content.backgroundColor || '#1f2937', color: content.textColor || '#ffffff' }}
    >
      {content.label && (
        <p className="text-sm font-medium mb-4 opacity-90">{content.label}</p>
      )}

      {isExpired ? (
        <p className="text-lg font-bold">Oferta finalizada</p>
      ) : (
        <div className="flex items-center justify-center gap-3">
          <div className="text-center">
            <div
              className="text-3xl font-bold px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: content.numberColor || '#ef4444' }}
            >
              {pad(timeLeft.days)}
            </div>
            <p className="text-[10px] mt-1 opacity-70">Dias</p>
          </div>
          <span className="text-2xl font-bold opacity-50">:</span>
          <div className="text-center">
            <div
              className="text-3xl font-bold px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: content.numberColor || '#ef4444' }}
            >
              {pad(timeLeft.hours)}
            </div>
            <p className="text-[10px] mt-1 opacity-70">Horas</p>
          </div>
          <span className="text-2xl font-bold opacity-50">:</span>
          <div className="text-center">
            <div
              className="text-3xl font-bold px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: content.numberColor || '#ef4444' }}
            >
              {pad(timeLeft.minutes)}
            </div>
            <p className="text-[10px] mt-1 opacity-70">Min</p>
          </div>
          <span className="text-2xl font-bold opacity-50">:</span>
          <div className="text-center">
            <div
              className="text-3xl font-bold px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: content.numberColor || '#ef4444' }}
            >
              {pad(timeLeft.seconds)}
            </div>
            <p className="text-[10px] mt-1 opacity-70">Seg</p>
          </div>
        </div>
      )}
    </div>
  );
}
