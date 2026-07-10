'use client';

import { TrendingUp, BarChart3, Users, Package } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function AnalyticsAvanzadoPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHeader
        title="Analytics Avanzado"
        description="Metricas detalladas del negocio"
      />

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-brand-500/10 rounded-2xl flex items-center justify-center mb-4">
          <TrendingUp size={32} className="text-brand-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Modulo en desarrollo</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Los analytics avanzados (CLV, rotacion de inventario, tendencias estacionales, cohortes y predicciones) estaran disponibles proximamente.
        </p>
        <div className="flex justify-center gap-6 mt-6">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto bg-gray-800 rounded-lg flex items-center justify-center mb-2">
              <Users size={18} className="text-gray-500" />
            </div>
            <p className="text-xs text-gray-500">CLV</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto bg-gray-800 rounded-lg flex items-center justify-center mb-2">
              <Package size={18} className="text-gray-500" />
            </div>
            <p className="text-xs text-gray-500">Rotacion</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto bg-gray-800 rounded-lg flex items-center justify-center mb-2">
              <BarChart3 size={18} className="text-gray-500" />
            </div>
            <p className="text-xs text-gray-500">Tendencias</p>
          </div>
        </div>
      </div>
    </div>
  );
}
