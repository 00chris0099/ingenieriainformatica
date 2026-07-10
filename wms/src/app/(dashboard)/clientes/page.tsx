'use client';

import { useState } from 'react';
import { Users, MessageSquare } from 'lucide-react';
import ClientesList from './clientes-list';
import ComunicacionesPage from '../comunicaciones/page';

type Tab = 'clientes' | 'notificaciones';

const tabs = [
  { key: 'clientes' as Tab, label: 'Clientes', icon: Users },
  { key: 'notificaciones' as Tab, label: 'Notificaciones', icon: MessageSquare },
];

export default function ClientesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('clientes');

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold text-white">Clientes</h2>
        <p className="text-sm text-gray-400">CRM y notificaciones</p>
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

      {activeTab === 'clientes' && <ClientesList />}
      {activeTab === 'notificaciones' && <ComunicacionesPage />}
    </div>
  );
}
