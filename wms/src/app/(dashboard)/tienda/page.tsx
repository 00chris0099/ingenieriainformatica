'use client';

import { useState } from 'react';
import { Package, Tag, Percent } from 'lucide-react';
import CatalogoPage from '../catalogo/page';
import CuponesPage from '../cupones/page';
import ImpuestosPage from '../impuestos/page';

type Tab = 'productos' | 'cupones' | 'impuestos';

const tabs = [
  { key: 'productos' as Tab, label: 'Productos', icon: Package },
  { key: 'cupones' as Tab, label: 'Cupones', icon: Tag },
  { key: 'impuestos' as Tab, label: 'Impuestos', icon: Percent },
];

export default function TiendaPage() {
  const [activeTab, setActiveTab] = useState<Tab>('productos');

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold text-white">Tienda</h2>
        <p className="text-sm text-gray-400">Productos, cupones e impuestos</p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-brand-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'productos' && <CatalogoPage />}
      {activeTab === 'cupones' && <CuponesPage />}
      {activeTab === 'impuestos' && <ImpuestosPage />}
    </div>
  );
}
