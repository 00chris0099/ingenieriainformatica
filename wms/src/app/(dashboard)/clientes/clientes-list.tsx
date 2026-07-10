'use client';

import { Users, Search, Eye, Loader2, Plus, Mail, Phone, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const typeLabels: Record<string, { label: string; color: string }> = {
  individual: { label: 'Individual', color: 'bg-gray-500/20 text-gray-400' },
  business: { label: 'Empresa', color: 'bg-blue-500/20 text-blue-400' },
  importer: { label: 'Importador', color: 'bg-purple-500/20 text-purple-400' },
};

export default function ClientesList() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; customer: any }>({ open: false, customer: null });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('q', search);
      const res = await fetch(`/api/v1/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDelete = async () => {
    if (!deleteDialog.customer) return;
    try {
      await fetch(`/api/v1/customers/${deleteDialog.customer.id}`, { method: 'DELETE' });
      setCustomers(customers.filter(c => c.id !== deleteDialog.customer.id));
    } catch (err) { console.error(err); }
    setDeleteDialog({ open: false, customer: null });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o RUC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <Link href="/clientes/nuevo"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 rounded-xl text-sm font-medium text-white transition-colors">
          <Plus size={16} /> Nuevo Cliente
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      )}

      {!loading && customers.length === 0 && (
        <EmptyState icon={Users} title="No hay clientes" description="Los clientes que se registren en la tienda apareceran aqui" />
      )}

      {!loading && customers.length > 0 && (
        <>
          {/* Mobile */}
          <div className="lg:hidden space-y-3">
            {customers.map((customer) => (
              <div key={customer.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-brand-400">{customer.fullName?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{customer.fullName}</p>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeLabels[customer.customerType]?.color || 'bg-gray-500/20 text-gray-400'}`}>
                    {typeLabels[customer.customerType]?.label || customer.customerType}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  {customer.phone && <span className="flex items-center gap-1"><Phone size={12} /> {customer.phone}</span>}
                  <span className="flex items-center gap-1"><Mail size={12} /> {customer._count?.orders || 0} pedidos</span>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                  <Link href={`/clientes/${customer.id}/editar`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-800 rounded-lg text-xs text-gray-300 hover:bg-gray-700">
                    <Edit size={14} /> Editar
                  </Link>
                  <button onClick={() => setDeleteDialog({ open: true, customer })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-900/30 rounded-lg text-xs text-red-400 hover:bg-red-900/50">
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden lg:block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Contacto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Pedidos</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-brand-400">{customer.fullName?.charAt(0) || '?'}</span>
                        </div>
                        <span className="text-sm font-medium text-white">{customer.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      <div>{customer.email}</div>
                      {customer.phone && <div className="text-xs text-gray-500">{customer.phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeLabels[customer.customerType]?.color || 'bg-gray-500/20 text-gray-400'}`}>
                        {typeLabels[customer.customerType]?.label || customer.customerType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 text-right">{customer._count?.orders || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/clientes/${customer.id}/editar`} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"><Edit size={14} /></Link>
                        <button onClick={() => setDeleteDialog({ open: true, customer })} className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, customer: null })}
        onConfirm={handleDelete}
        title="Eliminar Cliente"
        message="Esta accion eliminara permanentemente el cliente y todos sus datos."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
