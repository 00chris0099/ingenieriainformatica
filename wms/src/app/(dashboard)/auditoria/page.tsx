'use client';

import { Shield, Search, User, Clock, Edit, Plus, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const actionConfig: Record<string, { color: string; icon: any }> = {
  create: { color: 'bg-green-500/20 text-green-400', icon: Plus },
  update: { color: 'bg-blue-500/20 text-blue-400', icon: Edit },
  delete: { color: 'bg-red-500/20 text-red-400', icon: Trash2 },
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/audit?limit=50');
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold text-white">Auditoria</h2>
        <p className="text-sm text-gray-400">{logs.length} registros recientes</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-400" /></div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const ac = actionConfig[log.action] || actionConfig.update;
            const Icon = ac.icon;
            return (
              <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ac.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{log.action?.toUpperCase()}</p>
                      <span className="text-xs text-gray-500">{log.tableName}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{log.recordId}</p>
                    {log.changedFields?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">Cambios: {log.changedFields.join(', ')}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
                      {log.performedByType && <span className="flex items-center gap-1"><User size={10} /> {log.performedByType}</span>}
                      {log.createdAt && <span className="flex items-center gap-1"><Clock size={10} /> {new Date(log.createdAt).toLocaleString('es-PE')}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-500"><Shield size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No hay registros de auditoria</p></div>
          )}
        </div>
      )}
    </div>
  );
}
