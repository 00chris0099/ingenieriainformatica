'use client';

import { Shield, Truck, RotateCcw } from 'lucide-react';
import { useProductForm } from '../ProductFormContext';

export default function TrustBadges() {
  const { warrantyDays } = useProductForm();

  const badges = [];

  badges.push({
    icon: Truck,
    title: 'Envio disponible',
  });

  if (warrantyDays) {
    badges.push({
      icon: Shield,
      title: `Garantia ${Math.round(warrantyDays / 30)} meses`,
    });
  }

  badges.push({
    icon: RotateCcw,
    title: 'Devoluciones',
  });

  return (
    <div className="grid grid-cols-3 gap-3">
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <div key={index} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl text-center">
            <Icon size={18} className="text-green-600" />
            <p className="text-[10px] font-medium text-gray-700">{badge.title}</p>
          </div>
        );
      })}
    </div>
  );
}
