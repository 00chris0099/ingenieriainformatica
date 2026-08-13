'use client';

import { Shield, Search, User, Clock, Edit, Plus, Trash2, Loader2, Eye, LogOut, Download, FilterX, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toCsv } from '@/lib/csv';

const defaultConfig = { color: 'bg-blue-500/20 text-blue-400', icon: Edit };
const actionConfig: Record<string, { color: string; icon: any }> = {
  create: { color: 'bg-green-500/20 text-green-400', icon: Plus },
  update: defaultConfig,
  delete: { color: 'bg-red-500/20 text-red-400', icon: Trash2 },
  impersonate: { color: 'bg-amber-500/20 text-amber-400', icon: Eye },
  impersonate_end: { color: 'bg-blue-500/20 text-blue-400', icon: LogOut },
};

const ACTION_LABELS: Record<string, string> = {
  impersonate: 'IMPERSONACIÓN · SESIÓN TEMPORAL ABIERTA',
  impersonate_end: 'IMPERSONACIÓN · SESIÓN TEMPORAL CERRADA',
};

const ACTION_OPTIONS = [
  'create', 'update', 'delete', 'login', 'logout', 'export', 'import',
  'approve', 'reject', 'execute', 'impersonate', 'impersonate_end',
];

function metadataLine(log: any): string | null {
  const nv = log.newValues && typeof log.newValues === 'object' ? log.newValues : {};
  const parts: string[] = [];
  if (nv.targetEmail || nv.adminEmail) parts.push(`Cliente: ${nv.targetEmail || '—'} · Admin: ${nv.adminEmail || '—'}`);
  if (nv.reason) parts.push(`Motivo: ${nv.reason}`);
  if (nv.mode === 'readonly') parts.push('Modo: solo lectura');
  if (nv.bulkClose) parts.push(`Cierre masivo: ${nv.closedCount} sesiones`);
  if (nv.passwordChanged) parts.push(`Cambio de contraseña (${nv.otherSessionsRevoked ?? 0} sesiones cerradas)`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function auditRowsToCsv(rows: any[]): string {
  const header = ['Fecha', 'Acción', 'Tabla', 'Registro', 'Realizado por', 'Tipo', 'IP', 'Detalle'];
  const lines = rows.map((log) =>
    [
      new Date(log.createdAt).toLocaleString('es-PE'),
      log.action,
      log.tableName,
      log.recordId,
      log.performedByEmail || log.performedBy || '',
      log.performedByType || '',
      log.ipAddress || '',
      metadataLine(log) || '',
    ]
  );
  return toCsv([header, ...lines]);
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const buildQuery = useCallback((exportAll = false) => {
    const params = new URLSearchParams();
    params.set('limit', exportAll ? '5000' : '50');
    if (actionFilter) params.set('action', actionFilter);
    if (tableFilter.trim()) params.set('table', tableFilter.trim());
    if (fromDate) params.set('from', new Date(fromDate + 'T00:00:00').toISOString());
    if (toDate) params.set('to', new Date(toDate + 'T00:00:00').toISOString());
    return params.toString();
  }, [actionFilter, tableFilter, fromDate, toDate]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/audit?${buildQuery()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/v1/audit?${buildQuery(true)}`);
      const data = await res.json();
      const rows = Array.isArray(data.data) ? data.data : [];
      const csv = auditRowsToCsv(rows);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('CSV export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  const distinctTables = Array.from(new Set(logs.map((l) => l.tableName).filter(Boolean))).sort();

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Auditoría</h2>
          <p className="text-sm text-gray-400">{logs.length} registros · filtro activo</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all"
          >
            <RefreshCw size={12} /> Actualizar
          </button>
          <button
            onClick={exportCsv}
            disabled={exporting || logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-40 hover:opacity-90"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-wrap items-end gap-2">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Acción</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-300"
          >
            <option value="">Todas</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Tabla</label>
          <input
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            placeholder={distinctTables.length ? `p. ej. ${distinctTables[0]}` : 'tabla…'}
            list="audit-tables"
            className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-300 w-40"
          />
          <datalist id="audit-tables">
            {distinctTables.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Desde</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-300"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Hasta</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-300"
          />
        </div>
        <button
          onClick={() => { setActionFilter(''); setTableFilter(''); setFromDate(''); setToDate(''); }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-gray-700 text-gray-400 hover:text-gray-200 transition-all"
        >
          <FilterX size={12} /> Limpiar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-400" /></div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const ac = (log.action && actionConfig[log.action]) || defaultConfig;
            const Icon = ac.icon;
            return (
              <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ac.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{(ACTION_LABELS[log.action] || log.action?.toUpperCase())}</p>
                      <span className="text-xs text-gray-500">{log.tableName}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{log.recordId}</p>
                    {metadataLine(log) && <p className="text-xs text-gray-400 mt-1">{metadataLine(log)}</p>}
                    {log.changedFields?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">Cambios: {log.changedFields.join(', ')}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
                      {log.performedByEmail && <span className="flex items-center gap-1"><User size={10} /> {log.performedByEmail}</span>}
                      {log.performedByType && <span className="flex items-center gap-1"><User size={10} /> {log.performedByType}</span>}
                      {log.createdAt && <span className="flex items-center gap-1"><Clock size={10} /> {new Date(log.createdAt).toLocaleString('es-PE')}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-500"><Shield size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No hay registros de auditoría con esos filtros</p></div>
          )}
        </div>
      )}
    </div>
  );
}
