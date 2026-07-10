'use client';

import { useState } from 'react';
import { Palette, ChevronDown, ChevronUp } from 'lucide-react';

interface BlockStyleEditorProps {
  styles: Record<string, any>;
  onUpdate: (styles: Record<string, any>) => void;
}

export default function BlockStyleEditor({ styles, onUpdate }: BlockStyleEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateStyle = (key: string, value: any) => {
    onUpdate({ ...styles, [key]: value });
  };

  const updateMargin = (side: string, value: string) => {
    const margin = styles.margin || { top: '0', right: '0', bottom: '0', left: '0' };
    onUpdate({ ...styles, margin: { ...margin, [side]: value } });
  };

  const updatePadding = (side: string, value: string) => {
    const padding = styles.padding || { top: '0', right: '0', bottom: '0', left: '0' };
    onUpdate({ ...styles, padding: { ...padding, [side]: value } });
  };

  const updateBorder = (key: string, value: any) => {
    const border = styles.border || { width: '0', style: 'solid', color: '#e5e7eb', radius: '0' };
    onUpdate({ ...styles, border: { ...border, [key]: value } });
  };

  const updateShadow = (key: string, value: any) => {
    const shadow = styles.shadow || { offsetX: '0', offsetY: '0', blur: '0', spread: '0', color: 'rgba(0,0,0,0.1)' };
    onUpdate({ ...styles, shadow: { ...shadow, [key]: value } });
  };

  return (
    <div className="border-t border-gray-700 pt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <Palette size={14} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-400">Estilos CSS</span>
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Background */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-gray-500 uppercase">Fondo</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Color</label>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={styles.backgroundColor || '#ffffff'}
                    onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                    className="w-8 h-8 rounded border border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styles.backgroundColor || '#ffffff'}
                    onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                    className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Imagen</label>
                <input
                  type="text"
                  value={styles.backgroundImage || ''}
                  onChange={(e) => updateStyle('backgroundImage', e.target.value)}
                  placeholder="url(...)"
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Margin */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-gray-500 uppercase">Margin</label>
            <div className="grid grid-cols-4 gap-2">
              {['top', 'right', 'bottom', 'left'].map(side => (
                <div key={side}>
                  <label className="block text-[10px] text-gray-600 mb-1 capitalize">{side}</label>
                  <input
                    type="text"
                    value={styles.margin?.[side] || '0'}
                    onChange={(e) => updateMargin(side, e.target.value)}
                    placeholder="0px"
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Padding */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-gray-500 uppercase">Padding</label>
            <div className="grid grid-cols-4 gap-2">
              {['top', 'right', 'bottom', 'left'].map(side => (
                <div key={side}>
                  <label className="block text-[10px] text-gray-600 mb-1 capitalize">{side}</label>
                  <input
                    type="text"
                    value={styles.padding?.[side] || '0'}
                    onChange={(e) => updatePadding(side, e.target.value)}
                    placeholder="0px"
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Border */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-gray-500 uppercase">Borde</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Ancho</label>
                <input
                  type="text"
                  value={styles.border?.width || '0'}
                  onChange={(e) => updateBorder('width', e.target.value)}
                  placeholder="0px"
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Estilo</label>
                <select
                  value={styles.border?.style || 'solid'}
                  onChange={(e) => updateBorder('style', e.target.value)}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="solid">Solido</option>
                  <option value="dashed">Guiones</option>
                  <option value="dotted">Puntos</option>
                  <option value="none">Ninguno</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Color</label>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={styles.border?.color || '#e5e7eb'}
                    onChange={(e) => updateBorder('color', e.target.value)}
                    className="w-8 h-8 rounded border border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styles.border?.color || '#e5e7eb'}
                    onChange={(e) => updateBorder('color', e.target.value)}
                    className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Radio</label>
                <input
                  type="text"
                  value={styles.border?.radius || '0'}
                  onChange={(e) => updateBorder('radius', e.target.value)}
                  placeholder="0px"
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Box Shadow */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-gray-500 uppercase">Sombra</label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">X</label>
                <input
                  type="text"
                  value={styles.shadow?.offsetX || '0'}
                  onChange={(e) => updateShadow('offsetX', e.target.value)}
                  placeholder="0px"
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Y</label>
                <input
                  type="text"
                  value={styles.shadow?.offsetY || '0'}
                  onChange={(e) => updateShadow('offsetY', e.target.value)}
                  placeholder="0px"
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Blur</label>
                <input
                  type="text"
                  value={styles.shadow?.blur || '0'}
                  onChange={(e) => updateShadow('blur', e.target.value)}
                  placeholder="0px"
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Spread</label>
                <input
                  type="text"
                  value={styles.shadow?.spread || '0'}
                  onChange={(e) => updateShadow('spread', e.target.value)}
                  placeholder="0px"
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-600 mb-1">Color de sombra</label>
              <input
                type="text"
                value={styles.shadow?.color || 'rgba(0,0,0,0.1)'}
                onChange={(e) => updateShadow('color', e.target.value)}
                placeholder="rgba(0,0,0,0.1)"
                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
