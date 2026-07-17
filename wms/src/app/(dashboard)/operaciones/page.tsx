'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import PedidosPage from '../pedidos/page';

type Tab = 'pedidos';

const tabs = [
  { key: 'pedidos' as Tab, label: 'Pedidos', icon: ShoppingCart },
];

export default function OperacionesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pedidos');

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold text-white">Operaciones</h2>
        <p className="text-sm text-gray-400">Gestion de pedidos</p>
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

      {activeTab === 'pedidos' && <PedidosPage />}
    </div>
  );
}
