'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Store, Loader2, Eye, Pencil, Package, CalendarDays, FileText,
  Globe, RefreshCw, ExternalLink, Building2, LayoutTemplate, CreditCard,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  store: { label: 'Tienda Virtual', color: '#0f766e', bg: '#CCFBF1', icon: Store },
  landing: { label: 'Landing Page', color: '#7c3aed', bg: '#EDE9FE', icon: CalendarDays },
  corporate: { label: 'Corporativa', color: '#1d4ed8', bg: '#DBEAFE', icon: Building2 },
  page: { label: 'Página', color: '#57534e', bg: '#F5F5F4', icon: FileText },
};

function TypeBadge({ type }: { type?: string }) {
  const meta = TYPE_META[type || 'page'] || TYPE_META.page!;
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: meta.bg, color: meta.color }}>
      <Icon size={10} />
      {meta.label}
    </span>
  );
}

export default function MisTiendasPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStores = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/v1/businesses');
      if (res.ok) {
        const data = await res.json();
        setBusinesses(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('[MIS TIENDAS]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  const publishedPages = (b: any) => (b.pages || []).filter((p: any) => p.status === 'published');

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Mis Tiendas Virtuales
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            {businesses.length} tienda{businesses.length !== 1 ? 's' : ''} asignada{businesses.length !== 1 ? 's' : ''} a tu cuenta — gestiona cada una según su tipo
          </p>
        </div>
        <button
          onClick={() => fetchStores(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border transition-colors hover:bg-[var(--color-bg-hover)]"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {loading && <TableSkeleton rows={4} columns={3} />}

      {!loading && businesses.length === 0 && (
        <EmptyState
          icon={<Store size={26} />}
          title="No tienes tiendas asignadas"
          description="Cuando el administrador te asigne una o varias tiendas virtuales, aparecerán aquí para que las gestiones."
        />
      )}

      {!loading && businesses.length > 0 && (
        <div className="space-y-4">
          {businesses.map((b) => {
            const pages: any[] = b.pages || [];
            const live = publishedPages(b);
            return (
              <div key={b.id} className="surface-card p-5">
                {/* Store header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent-muted)' }}>
                      <Store size={20} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{b.name}</h3>
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-gray-500/10 text-[var(--color-text-tertiary)]">{b.industry}</span>
                        {b.assignedRole && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                            {b.assignedRole === 'manager' ? 'Gestor' : 'Propietario'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          <Globe size={11} />
                          {b.subdomain ? `${b.subdomain}.tuplataforma.com` : 'sin dominio'}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          {pages.length} página{pages.length !== 1 ? 's' : ''}
                        </span>
                        {live.length > 0 && (
                          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--color-success)' }}>
                            ● {live.length} en línea
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {live.length > 0 && (
                    <a
                      href={`/p/${live[0].slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-colors"
                      style={{ background: 'var(--color-accent)', color: '#fff' }}
                    >
                      <ExternalLink size={13} />
                      Ver tienda
                    </a>
                  )}
                </div>

                {/* Pages list */}
                <div className="mt-4 space-y-2">
                  {pages.length === 0 && (
                    <p className="text-sm text-[var(--color-text-tertiary)]">Esta tienda aún no tiene páginas creadas.</p>
                  )}
                  {pages.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-bg-hover)' }}>
                          <LayoutTemplate size={14} style={{ color: 'var(--color-text-secondary)' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{p.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <TypeBadge type={p.type} />
                            {p.status === 'published' ? (
                              <Badge variant="success">Publicada</Badge>
                            ) : (
                              <Badge variant="neutral">Borrador</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/builder/${p.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors hover:opacity-80"
                          style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                        >
                          <Pencil size={12} />
                          Editar diseño
                        </Link>
                        {p.status === 'published' && (
                          <a
                            href={`/p/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors"
                            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                          >
                            <Eye size={12} />
                            Ver
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Type-specific quick actions */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--color-text-tertiary)] mr-1">
                    Herramientas de esta tienda:
                  </span>
                  {pages.some((p: any) => p.type === 'store') && (
                    <Link
                      href="/catalogo"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors hover:opacity-80"
                      style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}
                    >
                      <Package size={12} />
                      Catálogo, precios & ofertas
                    </Link>
                  )}
                  {pages.some((p: any) => p.type === 'landing') && (
                    <Link
                      href={`/builder/${pages.find((p: any) => p.type === 'landing')?.id || ''}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors hover:opacity-80"
                      style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}
                    >
                      <CalendarDays size={12} />
                      Calendario & Video VSL
                    </Link>
                  )}
                  {pages.some((p: any) => p.type === 'corporate') && (
                    <Link
                      href={`/builder/${pages.find((p: any) => p.type === 'corporate')?.id || ''}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors hover:opacity-80"
                      style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}
                    >
                      <FileText size={12} />
                      SEO & Blog corporativo
                    </Link>
                  )}
                  <Link
                    href={`/pagos?store=${b.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors hover:opacity-80"
                    style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}
                  >
                    <CreditCard size={12} />
                    Cobros & Pagos
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
