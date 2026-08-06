'use client';

import { Users, Search, Mail, Phone, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

const typeLabels: Record<string, { label: string; variant: 'neutral' | 'info' | 'accent' }> = {
  individual: { label: 'Individual', variant: 'neutral' },
  business: { label: 'Empresa', variant: 'info' },
  importer: { label: 'Importador', variant: 'accent' },
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
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o RUC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <Link href="/clientes/nuevo">
          <Button icon={<Users size={16} />}>Nuevo Cliente</Button>
        </Link>
      </div>

      {loading && <TableSkeleton rows={5} columns={5} />}

      {!loading && customers.length === 0 && (
        <EmptyState
          icon={<Users size={24} />}
          title="No hay clientes"
          description="Los clientes que se registren en la tienda apareceran aqui"
        />
      )}

      {!loading && customers.length > 0 && (
        <>
          {/* Mobile */}
          <div className="lg:hidden space-y-3 stagger-children">
            {customers.map((customer) => (
              <div key={customer.id} className="surface-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--color-accent-muted)' }}>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                        {customer.fullName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{customer.fullName}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">{customer.email}</p>
                    </div>
                  </div>
                  <Badge variant={typeLabels[customer.customerType]?.variant || 'neutral'}>
                    {typeLabels[customer.customerType]?.label || customer.customerType}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-text-tertiary)]">
                  {customer.phone && (
                    <span className="flex items-center gap-1"><Phone size={12} /> {customer.phone}</span>
                  )}
                  <span className="flex items-center gap-1"><Mail size={12} /> {customer._count?.orders || 0} pedidos</span>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--color-border)]">
                  <Link href={`/clientes/${customer.id}/editar`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full" icon={<Edit size={14} />}>Editar</Button>
                  </Link>
                  <Button variant="danger" size="sm" className="flex-1" icon={<Trash2 size={14} />}
                    onClick={() => setDeleteDialog({ open: true, customer })}>Eliminar</Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden lg:block surface-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Tipo</th>
                  <th className="text-right">Pedidos</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--color-accent-muted)' }}>
                          <span className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>
                            {customer.fullName?.charAt(0) || '?'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{customer.fullName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="text-[var(--color-text-secondary)]">{customer.email}</div>
                      {customer.phone && <div className="text-xs text-[var(--color-text-tertiary)]">{customer.phone}</div>}
                    </td>
                    <td>
                      <Badge variant={typeLabels[customer.customerType]?.variant || 'neutral'}>
                        {typeLabels[customer.customerType]?.label || customer.customerType}
                      </Badge>
                    </td>
                    <td className="text-right text-[var(--color-text-secondary)]">{customer._count?.orders || 0}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/clientes/${customer.id}/editar`}
                          className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors">
                          <Edit size={14} />
                        </Link>
                        <button onClick={() => setDeleteDialog({ open: true, customer })}
                          className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] rounded-lg hover:bg-[var(--color-error-muted)] transition-colors">
                          <Trash2 size={14} />
                        </button>
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
