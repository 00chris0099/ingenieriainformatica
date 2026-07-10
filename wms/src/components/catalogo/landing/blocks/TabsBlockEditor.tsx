'use client';

import { Plus, X, GripVertical } from 'lucide-react';

interface TabsBlockEditorProps {
  content: Record<string, any>;
  onUpdate: (content: Record<string, any>) => void;
}

export default function TabsBlockEditor({ content, onUpdate }: TabsBlockEditorProps) {
  const items = content.items || [];

  const addItem = () => {
    if (items.length < 6) {
      onUpdate({ items: [...items, { title: 'Nuevo Tab', content: '' }] });
    }
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      onUpdate({ items: items.filter((_: any, i: number) => i !== index) });
    }
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate({ items: newItems });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-500">Tabs ({items.length}/6)</label>
        <button
          type="button"
          onClick={addItem}
          disabled={items.length >= 6}
          className="flex items-center gap-1 px-2 py-1 text-xs text-brand-400 bg-brand-500/10 rounded-lg hover:bg-brand-500/20 disabled:opacity-50"
        >
          <Plus size={10} /> Agregar
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item: any, index: number) => (
          <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical size={12} className="text-gray-600" />
                <span className="text-xs text-gray-500">Tab {index + 1}</span>
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={items.length <= 1}
                className="p-1 text-gray-500 hover:text-red-400 disabled:opacity-50"
              >
                <X size={12} />
              </button>
            </div>
            <input
              type="text"
              value={item.title || ''}
              onChange={(e) => updateItem(index, 'title', e.target.value)}
              placeholder="Titulo del tab"
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <textarea
              value={item.content || ''}
              onChange={(e) => updateItem(index, 'content', e.target.value)}
              placeholder="Contenido del tab..."
              rows={3}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
