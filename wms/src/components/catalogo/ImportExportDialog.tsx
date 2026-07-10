'use client';

import { useState, useRef } from 'react';
import { X, Download, Upload, FileText, FileSpreadsheet, FileJson, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
  onImportComplete?: () => void;
}

interface ImportResult {
  created: number;
  updated: number;
  errors: { index: number; error: string }[];
  total: number;
}

export default function ImportExportDialog({ isOpen, onClose, mode, onImportComplete }: ImportExportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importMode, setImportMode] = useState<'create' | 'update'>('create');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = async (format: 'csv' | 'json') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/products/export?format=${format}`);
      if (res.ok) {
        if (format === 'csv') {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `products-${Date.now()}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          const data = await res.json();
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `products-${Date.now()}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    // Parse file for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (selectedFile.name.endsWith('.json')) {
          const data = JSON.parse(content);
          const products = data.products || data;
          if (Array.isArray(products)) {
            setPreview(products.slice(0, 5));
          }
        } else if (selectedFile.name.endsWith('.csv')) {
          const lines = content.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const rows = lines.slice(1, 6).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            headers.forEach((h, i) => { row[h] = values[i]; });
            return row;
          });
          setPreview(rows);
        }
      } catch (err) {
        console.error('Failed to parse file:', err);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        let products: any[] = [];

        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          products = data.products || data;
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          products = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            headers.forEach((h, i) => { row[h] = values[i]; });
            return row;
          });
        }

        const res = await fetch('/api/v1/products/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products, mode: importMode }),
        });

        if (res.ok) {
          const data = await res.json();
          setResult(data.data);
          onImportComplete?.();
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error('Import failed:', err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            {mode === 'export' ? 'Exportar Productos' : 'Importar Productos'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'export' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Selecciona el formato para exportar todos los productos:</p>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handleExport('csv')}
                  disabled={loading}
                  className="flex flex-col items-center gap-3 p-6 bg-gray-800 border border-gray-700 rounded-xl hover:border-green-500 hover:bg-green-500/10 transition-colors"
                >
                  <FileSpreadsheet size={32} className="text-green-400" />
                  <span className="text-sm font-medium text-white">CSV</span>
                  <span className="text-xs text-gray-500">Excel compatible</span>
                </button>
                <button
                  onClick={() => handleExport('json')}
                  disabled={loading}
                  className="flex flex-col items-center gap-3 p-6 bg-gray-800 border border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-500/10 transition-colors"
                >
                  <FileJson size={32} className="text-blue-400" />
                  <span className="text-sm font-medium text-white">JSON</span>
                  <span className="text-xs text-gray-500">Formato tecnico</span>
                </button>
                <button
                  disabled={loading}
                  className="flex flex-col items-center gap-3 p-6 bg-gray-800 border border-gray-700 rounded-xl opacity-50 cursor-not-allowed"
                >
                  <FileText size={32} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-400">Excel</span>
                  <span className="text-xs text-gray-600">Proximamente</span>
                </button>
              </div>
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={20} className="animate-spin text-brand-400 mr-2" />
                  <span className="text-sm text-gray-400">Exportando...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Import Mode */}
              <div className="flex gap-3">
                <button
                  onClick={() => setImportMode('create')}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    importMode === 'create'
                      ? 'border-green-500 bg-green-500/10 text-green-400'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  Crear nuevos
                </button>
                <button
                  onClick={() => setImportMode('update')}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    importMode === 'update'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  Actualizar existentes
                </button>
              </div>

              {/* File Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-500/5 transition-colors"
              >
                <Upload size={32} className="mx-auto text-gray-500 mb-3" />
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-400">Haz clic para seleccionar un archivo</p>
                    <p className="text-xs text-gray-500 mt-1">CSV o JSON (max 100 productos)</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Preview */}
              {preview.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-400 mb-2">Vista previa (primeros 5):</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-700">
                          {Object.keys(preview[0]).slice(0, 5).map(key => (
                            <th key={key} className="px-2 py-1 text-left text-gray-500 font-medium">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className="border-b border-gray-700/50">
                            {Object.values(row).slice(0, 5).map((val, j) => (
                              <td key={j} className="px-2 py-1 text-gray-300">{String(val || '').substring(0, 30)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Button */}
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {loading ? 'Importando...' : 'Importar Productos'}
              </button>

              {/* Result */}
              {result && (
                <div className={`p-4 rounded-xl ${result.errors.length > 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.errors.length > 0 ? (
                      <AlertCircle size={16} className="text-yellow-400" />
                    ) : (
                      <CheckCircle size={16} className="text-green-400" />
                    )}
                    <span className="text-sm font-medium text-white">Importacion completada</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Creados: {result.created} | Actualizados: {result.updated}</p>
                    {result.errors.length > 0 && (
                      <p className="text-yellow-400">Errores: {result.errors.length}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
