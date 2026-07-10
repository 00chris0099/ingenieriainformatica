'use client';

import { useState } from 'react';
import { Bed, Gift, Package, ChevronRight, X } from 'lucide-react';
import templatesData from '@/data/templates.json';

interface TemplateSelectorProps {
  onSelect: (template: any) => void;
  onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  bed: <Bed size={24} />,
  gift: <Gift size={24} />,
  package: <Package size={24} />,
};

export default function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Seleccionar Plantilla</h2>
            <p className="text-xs text-gray-500">Pre-carga campos y configuracion para tu producto</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Templates List */}
        <div className="p-6 space-y-3">
          {templatesData.templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                selectedTemplate?.id === template.id
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedTemplate?.id === template.id
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {iconMap[template.icon] || <Package size={24} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{template.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {template.defaults.tags?.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">
                      {tag}
                    </span>
                  ))}
                  {template.categoryAttributes && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">
                      {template.categoryAttributes.length} atributos
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className={`${
                selectedTemplate?.id === template.id ? 'text-brand-400' : 'text-gray-600'
              }`} />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedTemplate}
            className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            Usar Plantilla
          </button>
        </div>
      </div>
    </div>
  );
}
