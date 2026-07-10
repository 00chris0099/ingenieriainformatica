'use client';

import { Plus, X, GripVertical, ChevronDown } from 'lucide-react';

interface AccordionBlockEditorProps {
  content: Record<string, any>;
  onUpdate: (content: Record<string, any>) => void;
}

export default function AccordionBlockEditor({ content, onUpdate }: AccordionBlockEditorProps) {
  const items = content.items || [];

  const addItem = () => {
    if (items.length < 10) {
      onUpdate({ items: [...items, { question: '', answer: '' }] });
    }
  };

  const removeItem = (index: number) => {
    onUpdate({ items: items.filter((_: any, i: number) => i !== index) });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate({ items: newItems });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-500">Elementos ({items.length}/10)</label>
        <button
          type="button"
          onClick={addItem}
          disabled={items.length >= 10}
          className="flex items-center gap-1 px-2 py-1 text-xs text-brand-400 bg-brand-500/10 rounded-lg hover:bg-brand-500/20 disabled:opacity-50"
        >
          <Plus size={10} /> Agregar
        </button>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Color de fondo</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={content.backgroundColor || '#ffffff'}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
            className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer"
          />
          <input
            type="text"
            value={content.backgroundColor || '#ffffff'}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item: any, index: number) => (
          <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical size={12} className="text-gray-600" />
                <ChevronDown size={12} className="text-gray-500" />
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-1 text-gray-500 hover:text-red-400"
              >
                <X size={12} />
              </button>
            </div>
            <input
              type="text"
              value={item.question || ''}
              onChange={(e) => updateItem(index, 'question', e.target.value)}
              placeholder="Pregunta..."
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <textarea
              value={item.answer || ''}
              onChange={(e) => updateItem(index, 'answer', e.target.value)}
              placeholder="Respuesta..."
              rows={2}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
