'use client';

import { useState, useEffect } from 'react';
import { Clock, User, ChevronDown, ChevronUp, RotateCcw, X, Loader2, GitBranch } from 'lucide-react';

interface Version {
  id: string;
  version: number;
  snapshot: any;
  diff: any;
  changeType: string;
  authorName: string;
  createdAt: string;
}

interface VersionHistoryPanelProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (versionId: string) => void;
}

export default function VersionHistoryPanel({ productId, isOpen, onClose, onRestore }: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && productId) {
      fetchVersions();
    }
  }, [isOpen, productId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/products/${productId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    }
    setLoading(false);
  };

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    try {
      const res = await fetch(`/api/v1/versions/${versionId}/restore`, {
        method: 'POST',
      });
      if (res.ok) {
        onRestore(versionId);
        setConfirmRestore(null);
        fetchVersions();
      }
    } catch (err) {
      console.error('Failed to restore version:', err);
    }
    setRestoring(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} dias`;
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const toggleExpand = (id: string) => {
    setExpandedVersion(expandedVersion === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-800 h-full overflow-hidden flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-white">Historial de Versiones</h2>
            <span className="text-xs text-gray-500">({versions.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-brand-400" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No hay versiones guardadas</p>
              <p className="text-xs mt-1">Las versiones se crean al guardar el producto</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden"
                >
                  {/* Version Header */}
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-750"
                    onClick={() => toggleExpand(version.id)}
                  >
                    <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-brand-400">v{version.version}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          Version {version.version}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          version.changeType === 'manual'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-600 text-gray-400'
                        }`}>
                          {version.changeType === 'manual' ? 'Manual' : 'Auto'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{formatDate(version.createdAt)}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">{version.authorName}</span>
                      </div>
                    </div>

                    {/* Diff badge */}
                    {version.diff?.changes && (
                      <span className="text-[10px] px-2 py-0.5 bg-gray-700 text-gray-400 rounded-full">
                        {version.diff.changes.length} cambio(s)
                      </span>
                    )}

                    <button className="p-1 text-gray-500 hover:text-white">
                      {expandedVersion === version.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Expanded Content */}
                  {expandedVersion === version.id && (
                    <div className="px-3 pb-3 border-t border-gray-700">
                      {/* Diff Changes */}
                      {version.diff?.changes && version.diff.changes.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium text-gray-400 mb-2">Cambios:</p>
                          {version.diff.changes.map((change: string, i: number) => (
                            <div key={i} className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                              {change}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Restore Button */}
                      <div className="mt-3">
                        {confirmRestore === version.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-yellow-400">Restaurar esta version?</span>
                            <button
                              onClick={() => handleRestore(version.id)}
                              disabled={restoring === version.id}
                              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {restoring === version.id ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <RotateCcw size={10} />
                              )}
                              Si, restaurar
                            </button>
                            <button
                              onClick={() => setConfirmRestore(null)}
                              className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRestore(version.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <RotateCcw size={12} />
                            Restaurar esta version
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
