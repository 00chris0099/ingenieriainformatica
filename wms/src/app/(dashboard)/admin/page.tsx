'use client';

import { useState } from 'react';
import { UserCog, Shield, TrendingUp } from 'lucide-react';
import UsuariosPage from '../usuarios/page';
import AuditoriaPage from '../auditoria/page';
import AnalyticsPage from '../analytics-avanzado/page';

type Tab = 'usuarios' | 'auditoria' | 'analytics';

const tabs = [
  { key: 'usuarios' as Tab, label: 'Usuarios', icon: UserCog },
  { key: 'auditoria' as Tab, label: 'Auditoria', icon: Shield },
  { key: 'analytics' as Tab, label: 'Analytics', icon: TrendingUp },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('usuarios');

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold text-white">Admin</h2>
        <p className="text-sm text-gray-400">Usuarios, auditoria y analytics</p>
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

      {activeTab === 'usuarios' && <UsuariosPage />}
      {activeTab === 'auditoria' && <AuditoriaPage />}
      {activeTab === 'analytics' && <AnalyticsPage />}
    </div>
  );
}
