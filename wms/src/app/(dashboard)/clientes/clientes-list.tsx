'use client';

import { Users, Search, Mail, Chrome, Globe, CheckCircle, XCircle, RefreshCw, ArrowRight, Crown, Star, User as UserIcon, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

const TIER_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  vip: { label: 'VIP', color: '#b45309', bg: '#FEF3C7', icon: Crown },
  frecuente: { label: 'Frecuente', color: '#1d4ed8', bg: '#DBEAFE', icon: Star },
  nuevo: { label: 'Nuevo', color: '#047857', bg: '#D1FAE5', icon: Sparkles },
  normal: { label: 'Normal', color: '#57534e', bg: '#F5F5F4', icon: UserIcon },
  problematico: { label: 'Riesgo', color: '#b91c1c', bg: '#FEE2E2', icon: XCircle },
};

function TierBadge({ tier }: { tier?: string }) {
  const key = tier || 'normal';
  const meta = TIER_META[key] ?? TIER_META.normal!;
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: meta.bg, color: meta.color }}>
      <Icon size={10} />
      {meta.label}
    </span>
  );
}

type SourceFilter = 'all' | 'google' | 'web';

export default function ClientesList() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (search) params.set('q', search);
      const res = await fetch(`/api/v1/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.data?.items)
          ? data.data.items
          : Array.isArray(data)
          ? data
          : [];
        setCustomers(items);
      }
    } catch (err) {
      console.error('[CLIENTES LIST]', err);
    }
    setLoading(false);
    setRefreshing(false);
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter(c => {
    if (sourceFilter === 'google') return c.source === 'Google OAuth';
    if (sourceFilter === 'web') return c.source === 'Registro Web';
    return true;
  });

  const googleCount = customers.filter(c => c.source === 'Google OAuth').length;
  const webCount = customers.filter(c => c.source === 'Registro Web').length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Clientes Registrados
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            {customers.length} usuario{customers.length !== 1 ? 's' : ''} registrado{customers.length !== 1 ? 's' : ''} en la plataforma
          </p>
        </div>
        <button
          onClick={() => fetchCustomers(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border transition-colors hover:bg-[var(--color-bg-hover)]"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
          {([['all', 'Todos', customers.length], ['google', 'Google', googleCount], ['web', 'Web', webCount]] as const).map(([val, label, count]) => (
            <button
              key={val}
              onClick={() => setSourceFilter(val as SourceFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sourceFilter === val
                  ? 'shadow-sm'
                  : 'hover:bg-[var(--color-bg-hover)]'
              }`}
              style={sourceFilter === val ? {
                background: 'var(--color-accent)',
                color: 'white',
              } : {
                color: 'var(--color-text-secondary)',
              }}
            >
              {label} <span className="opacity-70 ml-0.5">({count})</span>
            </button>
          ))}
        </div>
      </div>

      {loading && <TableSkeleton rows={5} columns={4} />}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<Users size={24} />}
          title="No hay clientes registrados"
          description="Los usuarios que se registren con Google o email apareceran aqui automaticamente"
        />
      )}

      {!loading && filtered.length > 0 && (
        <>
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3 stagger-children">
            {filtered.map((c) => (
              <div key={c.id} className="surface-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'var(--color-accent-muted)' }}>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                        {(c.fullName || c.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{c.fullName || '—'}</p>
                        <TierBadge tier={c.customerTier} />
                      </div>
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{c.email}</p>
                    </div>
                  </div>
                  <SourceBadge source={c.source} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {c.isActive ? (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-success)' }}>
                        <CheckCircle size={11} /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-error)' }}>
                        <XCircle size={11} /> Inactivo
                      </span>
                    )}
                    {c.phone && <span className="text-[10px] text-[var(--color-text-tertiary)]">{c.phone}</span>}
                  </div>
                  <Link
                    href={`/clientes/${c.id}/editar`}
                    className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-accent)] hover:underline"
                  >
                    Gestionar <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block surface-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Origen</th>
                  <th>Tier</th>
                  <th>Estado</th>
                  <th>Registrado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: 'var(--color-accent-muted)' }}>
                          <span className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>
                            {(c.fullName || c.email || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {c.fullName || c.email?.split('@')[0] || 'Usuario'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <Mail size={13} />
                        {c.email || '—'}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <SourceBadge source={c.source} />
                      </div>
                    </td>
                    <td><TierBadge tier={c.customerTier} /></td>
                    <td>
                      {c.isActive !== false ? (
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-success)' }}>
                          <CheckCircle size={12} /> Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-error)' }}>
                          <XCircle size={12} /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-PE') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  if (source === 'Google OAuth') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
        style={{ background: '#FEF3C7', color: '#92400E' }}>
        <Chrome size={11} />
        Google
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{ background: 'var(--color-info-muted)', color: 'var(--color-info)' }}>
      <Globe size={11} />
      Email
    </span>
  );
}
