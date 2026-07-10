'use client';

import { Plus, X, GripVertical, Star } from 'lucide-react';

interface TestimonialsBlockEditorProps {
  content: Record<string, any>;
  onUpdate: (content: Record<string, any>) => void;
}

export default function TestimonialsBlockEditor({ content, onUpdate }: TestimonialsBlockEditorProps) {
  const items = content.items || [];

  const addItem = () => {
    if (items.length < 6) {
      onUpdate({ items: [...items, { name: '', text: '', rating: 5 }] });
    }
  };

  const removeItem = (index: number) => {
    onUpdate({ items: items.filter((_: any, i: number) => i !== index) });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate({ items: newItems });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-500">Testimonios ({items.length}/6)</label>
        <button
          type="button"
          onClick={addItem}
          disabled={items.length >= 6}
          className="flex items-center gap-1 px-2 py-1 text-xs text-brand-400 bg-brand-500/10 rounded-lg hover:bg-brand-500/20 disabled:opacity-50"
        >
          <Plus size={10} /> Agregar
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item: any, index: number) => (
          <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <GripVertical size={12} className="text-gray-600" />
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
              value={item.name || ''}
              onChange={(e) => updateItem(index, 'name', e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <textarea
              value={item.text || ''}
              onChange={(e) => updateItem(index, 'text', e.target.value)}
              placeholder="Testimonio..."
              rows={2}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            />
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => updateItem(index, 'rating', star)}
                  className="p-0.5"
                >
                  <Star
                    size={12}
                    className={star <= (item.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
