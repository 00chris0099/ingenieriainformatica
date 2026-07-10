'use client';

import { Plus, X, GripVertical } from 'lucide-react';

interface ColumnsBlockEditorProps {
  content: Record<string, any>;
  onUpdate: (content: Record<string, any>) => void;
}

const presetLayouts = [
  { name: '50/50', widths: [50, 50] },
  { name: '33/33/33', widths: [33, 33, 34] },
  { name: '40/60', widths: [40, 60] },
  { name: '60/40', widths: [60, 40] },
  { name: '25/25/25/25', widths: [25, 25, 25, 25] },
  { name: '30/40/30', widths: [30, 40, 30] },
];

export default function ColumnsBlockEditor({ content, onUpdate }: ColumnsBlockEditorProps) {
  const columns = content.columns || [{ content: '', width: 50 }, { content: '', width: 50 }];
  const activePreset = content.activePreset || null;

  const addColumn = () => {
    if (columns.length < 4) {
      const equalWidth = Math.floor(100 / (columns.length + 1));
      const newColumns = columns.map((col: any) => ({ ...col, width: equalWidth }));
      newColumns.push({ content: '', width: 100 - (equalWidth * columns.length) });
      onUpdate({ columns: newColumns, activePreset: null });
    }
  };

  const removeColumn = (index: number) => {
    if (columns.length > 1) {
      const newColumns = columns.filter((_: any, i: number) => i !== index);
      const equalWidth = Math.floor(100 / newColumns.length);
      newColumns.forEach((col: any, i: number) => {
        col.width = i === newColumns.length - 1 ? 100 - (equalWidth * (newColumns.length - 1)) : equalWidth;
      });
      onUpdate({ columns: newColumns, activePreset: null });
    }
  };

  const updateColumn = (index: number, field: string, value: any) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    onUpdate({ columns: newColumns, activePreset: null });
  };

  const updateWidth = (index: number, width: number) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], width };

    // Auto-adjust other columns to maintain 100% total
    const otherColumns = newColumns.filter((_: any, i: number) => i !== index);
    const remainingWidth = 100 - width;
    const otherTotal = otherColumns.reduce((sum: number, col: any) => sum + (col.width || 0), 0);

    if (otherTotal > 0) {
      otherColumns.forEach((col: any) => {
        col.width = Math.round((col.width / otherTotal) * remainingWidth);
      });
      // Fix rounding errors
      const total = newColumns.reduce((sum: number, col: any) => sum + col.width, 0);
      if (total !== 100) {
        newColumns[0].width += 100 - total;
      }
    }

    onUpdate({ columns: newColumns, activePreset: null });
  };

  const applyPreset = (preset: typeof presetLayouts[0]) => {
    const newColumns = preset.widths.map((width, i) => ({
      content: columns[i]?.content || '',
      title: columns[i]?.title || '',
      width,
    }));
    onUpdate({ columns: newColumns, activePreset: preset.name });
  };

  return (
    <div className="space-y-4">
      {/* Preset Layouts */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">Layouts predefinidos</label>
        <div className="grid grid-cols-3 gap-2">
          {presetLayouts.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`px-2 py-1.5 text-[10px] rounded-lg border transition-colors ${
                activePreset === preset.name
                  ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Width Visualization */}
      <div className="flex h-6 rounded-lg overflow-hidden bg-gray-800">
        {columns.map((col: any, index: number) => (
          <div
            key={index}
            className="bg-brand-500/30 border-r border-gray-700 last:border-r-0 flex items-center justify-center"
            style={{ width: `${col.width}%` }}
          >
            <span className="text-[10px] text-brand-400 font-medium">{col.width}%</span>
          </div>
        ))}
      </div>

      {/* Column Controls */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-500">Columnas ({columns.length}/4)</label>
        <button
          type="button"
          onClick={addColumn}
          disabled={columns.length >= 4}
          className="flex items-center gap-1 px-2 py-1 text-xs text-brand-400 bg-brand-500/10 rounded-lg hover:bg-brand-500/20 disabled:opacity-50"
        >
          <Plus size={10} /> Agregar
        </button>
      </div>

      {/* Column Editors */}
      <div className="space-y-3">
        {columns.map((col: any, index: number) => (
          <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical size={12} className="text-gray-600" />
                <span className="text-xs text-gray-500">Columna {index + 1}</span>
              </div>
              <button
                type="button"
                onClick={() => removeColumn(index)}
                disabled={columns.length <= 1}
                className="p-1 text-gray-500 hover:text-red-400 disabled:opacity-50"
              >
                <X size={12} />
              </button>
            </div>

            {/* Width Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-gray-500">Ancho</label>
                <span className="text-[10px] text-brand-400 font-medium">{col.width}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={col.width}
                onChange={(e) => updateWidth(index, parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            {/* Title */}
            <input
              type="text"
              value={col.title || ''}
              onChange={(e) => updateColumn(index, 'title', e.target.value)}
              placeholder="Titulo (opcional)"
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />

            {/* Content */}
            <textarea
              value={col.content || ''}
              onChange={(e) => updateColumn(index, 'content', e.target.value)}
              placeholder="Contenido de la columna..."
              rows={3}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
