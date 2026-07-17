'use client';

import { CheckCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function CalidadPage() {
  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <PageHeader
        title="Control de Calidad"
        description="0 inspecciones registradas"
      />

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <CheckCircle size={32} className="mx-auto mb-2 text-gray-500" />
        <p className="text-sm text-gray-500">No hay inspecciones de calidad registradas</p>
      </div>
    </div>
  );
}
