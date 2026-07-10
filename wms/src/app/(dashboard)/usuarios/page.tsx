'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Loader2, Plus, Shield, Settings, Edit, CheckCircle, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

type Tab = 'users' | 'settings';

const roleConfig: Record<string, { color: string; label: string }> = {
  super_admin: { color: 'bg-red-500/20 text-red-400', label: 'Super Admin' },
  admin: { color: 'bg-purple-500/20 text-purple-400', label: 'Admin' },
  warehouse_manager: { color: 'bg-blue-500/20 text-blue-400', label: 'Gerente' },
  warehouse_staff: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Personal' },
  sales_manager: { color: 'bg-green-500/20 text-green-400', label: 'Gerente Ventas' },
  sales_rep: { color: 'bg-teal-500/20 text-teal-400', label: 'Ventas' },
  readonly: { color: 'bg-gray-500/20 text-gray-400', label: 'Solo Lectura' },
};

export default function UsuariosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('q', search);
      const res = await fetch(`/api/v1/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const tabs = [
    { key: 'users' as Tab, label: 'Usuarios', icon: Users },
    { key: 'settings' as Tab, label: 'Configuracion', icon: Settings },
  ];

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <PageHeader
        title="Usuarios y Configuracion"
        description={`${users.length} usuarios registrados`}
        actions={
          activeTab === 'users' && (
            <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700">
              <Plus size={18} /> Nuevo Usuario
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
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

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-brand-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => {
                const role = roleConfig[user.role] || roleConfig.readonly;
                return (
                  <div key={user.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">
                          {user.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${role.color}`}>
                            {role.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <CheckCircle size={14} className="text-green-400" />
                        ) : (
                          <XCircle size={14} className="text-red-400" />
                        )}
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                          <Edit size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {users.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No hay usuarios
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Roles y Permisos</h3>
            <div className="space-y-2">
              {Object.entries(roleConfig).map(([key, config]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-gray-400" />
                    <span className="text-sm text-white">{config.label}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.color}`}>
                    {key}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Configuracion General</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre del Negocio</label>
                <input
                  type="text"
                  defaultValue="ADRISU KIDS"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">RUC</label>
                <input
                  type="text"
                  defaultValue="10730431746"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Direccion</label>
                <input
                  type="text"
                  defaultValue="Av. Industrial 123, Lima"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Moneda</label>
                <select className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="PEN">Soles (PEN)</option>
                  <option value="USD">Dolares (USD)</option>
                </select>
              </div>
            </div>
          </div>

          <button className="w-full px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
            Guardar Configuracion
          </button>
        </div>
      )}
    </div>
  );
}
