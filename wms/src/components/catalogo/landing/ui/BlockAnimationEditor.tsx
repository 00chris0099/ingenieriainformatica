'use client';

import { useState } from 'react';
import { Play, ChevronDown, ChevronUp } from 'lucide-react';

interface BlockAnimationEditorProps {
  animation: Record<string, any>;
  onUpdate: (animation: Record<string, any>) => void;
}

const animationTypes = [
  { value: 'none', label: 'Ninguna' },
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideDown', label: 'Slide Down' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'zoomIn', label: 'Zoom In' },
  { value: 'zoomOut', label: 'Zoom Out' },
  { value: 'parallax', label: 'Parallax' },
];

const triggerTypes = [
  { value: 'load', label: 'Al cargar' },
  { value: 'scroll', label: 'Al hacer scroll' },
];

export default function BlockAnimationEditor({ animation, onUpdate }: BlockAnimationEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateField = (key: string, value: any) => {
    onUpdate({ ...animation, [key]: value });
  };

  return (
    <div className="border-t border-gray-700 pt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <Play size={14} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-400">Animacion</span>
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Animation Type */}
          <div>
            <label className="block text-[10px] text-gray-600 mb-1">Tipo de animacion</label>
            <select
              value={animation.type || 'none'}
              onChange={(e) => updateField('type', e.target.value)}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {animationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {animation.type && animation.type !== 'none' && (
            <>
              {/* Trigger */}
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Disparador</label>
                <select
                  value={animation.trigger || 'scroll'}
                  onChange={(e) => updateField('trigger', e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {triggerTypes.map(trigger => (
                    <option key={trigger.value} value={trigger.value}>{trigger.label}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Duracion (ms)</label>
                <input
                  type="number"
                  value={animation.duration || 500}
                  onChange={(e) => updateField('duration', parseInt(e.target.value) || 500)}
                  min="100"
                  max="3000"
                  step="100"
                  className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Delay */}
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Retraso (ms)</label>
                <input
                  type="number"
                  value={animation.delay || 0}
                  onChange={(e) => updateField('delay', parseInt(e.target.value) || 0)}
                  min="0"
                  max="2000"
                  step="100"
                  className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Preview button */}
              <button
                type="button"
                onClick={() => {
                  // Trigger animation preview
                  const event = new CustomEvent('preview-animation', { detail: { type: animation.type, duration: animation.duration } });
                  window.dispatchEvent(event);
                }}
                className="w-full px-3 py-1.5 bg-brand-500/20 text-brand-400 text-xs rounded-lg hover:bg-brand-500/30 transition-colors"
              >
                Previsualizar animacion
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
