'use client';

interface CountdownBlockEditorProps {
  content: Record<string, any>;
  onUpdate: (content: Record<string, any>) => void;
}

export default function CountdownBlockEditor({ content, onUpdate }: CountdownBlockEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Fecha y hora final</label>
        <input
          type="datetime-local"
          value={content.endDate || ''}
          onChange={(e) => onUpdate({ endDate: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Texto de etiqueta</label>
        <input
          type="text"
          value={content.label || ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Oferta termina en..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Color de fondo</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={content.backgroundColor || '#1f2937'}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer"
            />
            <input
              type="text"
              value={content.backgroundColor || '#1f2937'}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Color de texto</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={content.textColor || '#ffffff'}
              onChange={(e) => onUpdate({ textColor: e.target.value })}
              className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer"
            />
            <input
              type="text"
              value={content.textColor || '#ffffff'}
              onChange={(e) => onUpdate({ textColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Color de numeros</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={content.numberColor || '#ef4444'}
            onChange={(e) => onUpdate({ numberColor: e.target.value })}
            className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer"
          />
          <input
            type="text"
            value={content.numberColor || '#ef4444'}
            onChange={(e) => onUpdate({ numberColor: e.target.value })}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  );
}
