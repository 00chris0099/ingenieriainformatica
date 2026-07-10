'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useProductForm, LandingPageBlock } from '../ProductFormContext';
import {
  Plus, Trash2, GripVertical, Copy, ArrowUp, ArrowDown,
  Layout, Type, Image, Grid, Video, Star, MousePointer, MessageSquare,
  HelpCircle, Columns, Minus, Space, Mail, Clock, ListOrdered
} from 'lucide-react';
import ImageBlockEditor from '../landing/blocks/ImageBlockEditor';
import GalleryBlockEditor from '../landing/blocks/GalleryBlockEditor';
import FeaturesBlockEditor from '../landing/blocks/FeaturesBlockEditor';
import TestimonialsBlockEditor from '../landing/blocks/TestimonialsBlockEditor';
import FaqBlockEditor from '../landing/blocks/FaqBlockEditor';
import ColumnsBlockEditor from '../landing/blocks/ColumnsBlockEditor';
import ContactFormBlockEditor from '../landing/blocks/ContactFormBlockEditor';
import ContactFormBlockPreview from '../landing/blocks/ContactFormBlockPreview';
import CountdownBlockEditor from '../landing/blocks/CountdownBlockEditor';
import CountdownBlockPreview from '../landing/blocks/CountdownBlockPreview';
import TabsBlockEditor from '../landing/blocks/TabsBlockEditor';
import TabsBlockPreview from '../landing/blocks/TabsBlockPreview';
import AccordionBlockEditor from '../landing/blocks/AccordionBlockEditor';
import AccordionBlockPreview from '../landing/blocks/AccordionBlockPreview';
import BlockStyleEditor from '../landing/ui/BlockStyleEditor';
import BlockAnimationEditor from '../landing/ui/BlockAnimationEditor';

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero', icon: Layout, description: 'Imagen full-width con texto overlay' },
  { type: 'text', label: 'Texto', icon: Type, description: 'Titulo y contenido de texto' },
  { type: 'image', label: 'Imagen', icon: Image, description: 'Imagen individual con caption' },
  { type: 'gallery', label: 'Galeria', icon: Grid, description: 'Grid de 2-4 imagenes' },
  { type: 'video', label: 'Video', icon: Video, description: 'YouTube o Vimeo embed' },
  { type: 'features', label: 'Caracteristicas', icon: Star, description: 'Grid de features con iconos' },
  { type: 'cta', label: 'CTA', icon: MousePointer, description: 'Boton de accion' },
  { type: 'testimonials', label: 'Testimonios', icon: MessageSquare, description: 'Citas de clientes' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, description: 'Preguntas frecuentes' },
  { type: 'columns', label: 'Columnas', icon: Columns, description: 'Layout de 2-3 columnas' },
  { type: 'contact', label: 'Formulario', icon: Mail, description: 'Formulario de contacto' },
  { type: 'countdown', label: 'Contador', icon: Clock, description: 'Contador regresivo' },
  { type: 'tabs', label: 'Tabs', icon: ListOrdered, description: 'Pestanas con contenido' },
  { type: 'accordion', label: 'Accordion', icon: ListOrdered, description: 'Secciones colapsables' },
  { type: 'divider', label: 'Divisor', icon: Minus, description: 'Linea separadora' },
  { type: 'spacing', label: 'Espaciado', icon: Space, description: 'Bloque vacio con altura' },
];

const getDefaultContent = (type: string) => {
  switch (type) {
    case 'hero':
      return { title: '', subtitle: '', buttonText: '', buttonUrl: '#', backgroundColor: '#16a34a', textColor: '#ffffff' };
    case 'text':
      return { heading: '', body: '' };
    case 'image':
      return { url: '', caption: '', alignment: 'center', width: '100' };
    case 'gallery':
      return { images: [], columns: 2 };
    case 'video':
      return { url: '', autoplay: false, muted: true };
    case 'features':
      return { items: [] };
    case 'cta':
      return { text: '', url: '#', backgroundColor: '#16a34a', textColor: '#ffffff' };
    case 'testimonials':
      return { items: [] };
    case 'faq':
      return { items: [] };
    case 'columns':
      return { columns: [{ content: '' }, { content: '' }] };
    case 'contact':
      return { title: '', description: '', submitText: 'Enviar', buttonColor: '#16a34a', successMessage: '', destinationEmail: '' };
    case 'countdown':
      return { endDate: '', label: '', backgroundColor: '#1f2937', textColor: '#ffffff', numberColor: '#ef4444' };
    case 'tabs':
      return { items: [{ title: '', content: '' }] };
    case 'accordion':
      return { items: [] };
    case 'divider':
      return { style: 'solid', color: '#374151', thickness: 1 };
    case 'spacing':
      return { height: 60 };
    default:
      return {};
  }
};

interface LandingPageTabProps {
  slug: string;
}

export default function LandingPageTab({ slug }: LandingPageTabProps) {
  const { name, productImages, landingBlocks, setLandingBlocks, addLandingBlock, updateLandingBlock, removeLandingBlock, moveLandingBlock, duplicateLandingBlock } = useProductForm();
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Initialize blocks if empty - only once
  useEffect(() => {
    if (!initializedRef.current && landingBlocks.length === 0) {
      initializedRef.current = true;
      const defaultBlocks: LandingPageBlock[] = [
        {
          id: 'default-hero',
          type: 'hero',
          settings: { backgroundColor: '#16a34a', textColor: '#ffffff' },
          content: { title: name || 'Titulo del Producto', subtitle: 'Descubre todas las caracteristicas', buttonText: 'Comprar Ahora', buttonUrl: '#' },
        },
        {
          id: 'default-desc',
          type: 'text',
          settings: {},
          content: { heading: 'Descripcion', body: 'Agrega la descripcion de tu producto aqui...' },
        },
      ];
      setLandingBlocks(defaultBlocks);
    }
  }, [name, landingBlocks.length, setLandingBlocks]);

  const blocks = landingBlocks;

  const addBlock = useCallback((type: string) => {
    const newBlock: LandingPageBlock = {
      id: Math.random().toString(36).substring(2, 9),
      type: type as any,
      settings: {},
      content: getDefaultContent(type),
    };
    addLandingBlock(newBlock);
    setShowBlockPicker(false);
    setSelectedBlock(newBlock.id);
  }, [addLandingBlock]);

  const removeBlock = useCallback((id: string) => {
    removeLandingBlock(id);
    if (selectedBlock === id) setSelectedBlock(null);
  }, [selectedBlock, removeLandingBlock]);

  const duplicateBlock = useCallback((id: string) => {
    duplicateLandingBlock(id);
  }, [duplicateLandingBlock]);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    moveLandingBlock(index, newIndex);
  }, [blocks, moveLandingBlock]);

  const updateBlockContent = useCallback((id: string, content: Record<string, any>) => {
    const block = blocks.find(b => b.id === id);
    if (block) {
      updateLandingBlock(id, { content: { ...block.content, ...content } });
    }
  }, [blocks, updateLandingBlock]);

  const updateBlockSettings = useCallback((id: string, settings: Record<string, any>) => {
    const block = blocks.find(b => b.id === id);
    if (block) {
      updateLandingBlock(id, { settings: { ...block.settings, ...settings } });
    }
  }, [blocks, updateLandingBlock]);

  const handleDragStart = (id: string) => setDraggedBlock(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetId: string) => {
    if (!draggedBlock || draggedBlock === targetId) return;
    const fromIndex = blocks.findIndex(b => b.id === draggedBlock);
    const toIndex = blocks.findIndex(b => b.id === targetId);
    if (fromIndex !== -1 && toIndex !== -1) {
      moveLandingBlock(fromIndex, toIndex);
    }
    setDraggedBlock(null);
  };

  const selectedBlockData = blocks.find(b => b.id === selectedBlock);

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* Left Panel - Block List */}
      <div className="w-64 shrink-0 bg-gray-800/50 rounded-xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">Bloques</h3>
          <button
            type="button"
            onClick={() => setShowBlockPicker(true)}
            className="p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="space-y-2">
          {blocks.map((block) => {
            const blockType = BLOCK_TYPES.find(t => t.type === block.type);
            const Icon = blockType?.icon || Layout;
            return (
              <div
                key={block.id}
                draggable
                onDragStart={() => handleDragStart(block.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(block.id)}
                onClick={() => setSelectedBlock(block.id)}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedBlock === block.id
                    ? 'bg-brand-600/20 border border-brand-500'
                    : 'bg-gray-700/50 border border-transparent hover:bg-gray-700'
                }`}
              >
                <GripVertical size={12} className="text-gray-600 cursor-move" />
                <Icon size={14} className="text-gray-400" />
                <span className="text-xs text-gray-300 flex-1 truncate">{blockType?.label || block.type}</span>
                <div className="flex gap-0.5">
                  <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }} className="p-0.5 text-gray-600 hover:text-white">
                    <ArrowUp size={10} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }} className="p-0.5 text-gray-600 hover:text-white">
                    <ArrowDown size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center Panel - Block Editor */}
      <div className="flex-1 bg-gray-800/50 rounded-xl p-4 overflow-y-auto">
        {selectedBlockData ? (
          <BlockEditor
            block={selectedBlockData}
            onUpdateContent={(content) => updateBlockContent(selectedBlockData.id, content)}
            onUpdateSettings={(settings) => updateBlockSettings(selectedBlockData.id, settings)}
            onDuplicate={() => duplicateBlock(selectedBlockData.id)}
            onRemove={() => removeBlock(selectedBlockData.id)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Layout size={48} className="mb-4 opacity-50" />
            <p className="text-sm">Selecciona un bloque para editarlo</p>
            <p className="text-xs mt-1">o haz clic en + para agregar uno nuevo</p>
          </div>
        )}
      </div>

      {/* Block Picker Modal */}
      {showBlockPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Agregar Bloque</h3>
            <div className="grid grid-cols-3 gap-3">
              {BLOCK_TYPES.map((blockType) => {
                const Icon = blockType.icon;
                return (
                  <button
                    key={blockType.type}
                    onClick={() => addBlock(blockType.type)}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-brand-500 hover:bg-gray-700 transition-colors"
                  >
                    <Icon size={24} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">{blockType.label}</span>
                    <span className="text-xs text-gray-500 text-center">{blockType.description}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowBlockPicker(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Block Editor Component
function BlockEditor({
  block,
  onUpdateContent,
  onUpdateSettings,
  onDuplicate,
  onRemove,
}: {
  block: LandingPageBlock;
  onUpdateContent: (content: Record<string, any>) => void;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">
          Editar: {BLOCK_TYPES.find(t => t.type === block.type)?.label}
        </h3>
        <div className="flex gap-2">
          <button onClick={onDuplicate} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700">
            <Copy size={14} />
          </button>
          <button onClick={onRemove} className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Dynamic Editor Based on Block Type */}
      {block.type === 'hero' && (
        <div className="space-y-3">
          <input
            type="text"
            value={block.content.title || ''}
            onChange={(e) => onUpdateContent({ title: e.target.value })}
            placeholder="Titulo del Hero"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="text"
            value={block.content.subtitle || ''}
            onChange={(e) => onUpdateContent({ subtitle: e.target.value })}
            placeholder="Subtitulo"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="text"
            value={block.content.buttonText || ''}
            onChange={(e) => onUpdateContent({ buttonText: e.target.value })}
            placeholder="Texto del boton"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color de fondo</label>
              <input
                type="color"
                value={block.settings.backgroundColor || '#16a34a'}
                onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color de texto</label>
              <input
                type="color"
                value={block.settings.textColor || '#ffffff'}
                onChange={(e) => onUpdateSettings({ textColor: e.target.value })}
                className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {block.type === 'text' && (
        <div className="space-y-3">
          <input
            type="text"
            value={block.content.heading || ''}
            onChange={(e) => onUpdateContent({ heading: e.target.value })}
            placeholder="Titulo (opcional)"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <textarea
            value={block.content.body || ''}
            onChange={(e) => onUpdateContent({ body: e.target.value })}
            placeholder="Contenido del texto..."
            rows={6}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      {block.type === 'video' && (
        <div className="space-y-3">
          <input
            type="text"
            value={block.content.url || ''}
            onChange={(e) => onUpdateContent({ url: e.target.value })}
            placeholder="URL de YouTube o Vimeo"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={block.content.autoplay || false}
                onChange={(e) => onUpdateContent({ autoplay: e.target.checked })}
                className="rounded border-gray-600 bg-gray-700 text-brand-500"
              />
              Autoplay
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={block.content.muted || false}
                onChange={(e) => onUpdateContent({ muted: e.target.checked })}
                className="rounded border-gray-600 bg-gray-700 text-brand-500"
              />
              Mute
            </label>
          </div>
        </div>
      )}

      {block.type === 'cta' && (
        <div className="space-y-3">
          <input
            type="text"
            value={block.content.text || ''}
            onChange={(e) => onUpdateContent({ text: e.target.value })}
            placeholder="Texto del boton"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="text"
            value={block.content.url || ''}
            onChange={(e) => onUpdateContent({ url: e.target.value })}
            placeholder="URL del enlace"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color de fondo</label>
              <input
                type="color"
                value={block.content.backgroundColor || '#16a34a'}
                onChange={(e) => onUpdateContent({ backgroundColor: e.target.value })}
                className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color de texto</label>
              <input
                type="color"
                value={block.content.textColor || '#ffffff'}
                onChange={(e) => onUpdateContent({ textColor: e.target.value })}
                className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {block.type === 'divider' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Estilo</label>
            <select
              value={block.content.style || 'solid'}
              onChange={(e) => onUpdateContent({ style: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="solid">Solido</option>
              <option value="dashed">Guiones</option>
              <option value="dotted">Puntos</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Color</label>
            <input
              type="color"
              value={block.content.color || '#374151'}
              onChange={(e) => onUpdateContent({ color: e.target.value })}
              className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {block.type === 'spacing' && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Altura (px)</label>
          <input
            type="number"
            value={block.content.height || 60}
            onChange={(e) => onUpdateContent({ height: parseInt(e.target.value) || 60 })}
            min="10"
            max="200"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      {/* Block-specific editors */}
      {block.type === 'image' && (
        <ImageBlockEditor content={block.content} onUpdate={(content) => onUpdateContent(content)} />
      )}

      {block.type === 'gallery' && (
        <GalleryBlockEditor content={block.content} onUpdate={(content) => onUpdateContent(content)} />
      )}

      {block.type === 'features' && (
        <FeaturesBlockEditor content={block.content} onUpdate={(content) => onUpdateContent(content)} />
      )}

      {block.type === 'testimonials' && (
        <TestimonialsBlockEditor content={block.content} onUpdate={(content) => onUpdateContent(content)} />
      )}

      {block.type === 'faq' && (
        <FaqBlockEditor content={block.content} onUpdate={(content) => onUpdateContent(content)} />
      )}

      {block.type === 'columns' && (
        <ColumnsBlockEditor content={block.content} onUpdate={(content) => onUpdateContent(content)} />
      )}

      {block.type === 'contact' && (
        <ContactFormBlockEditor content={block.content} onUpdate={(content) => onUpdateContent(content)} />
      )}

      {block.type === 'countdown' && (
        <CountdownBlockEditor content={block.content} onUpdate={(content) => onUpdateContent(content)} />
      )}

      {block.type === 'tabs' && (
        <TabsBlockEditor content={block.content} onUpdate={(content) => onUpdateContent(content)} />
      )}

      {block.type === 'accordion' && (
        <AccordionBlockEditor content={block.content} onUpdate={(content) => onUpdateContent(content)} />
      )}

      {/* Generic editor for block types not yet implemented */}
      {!['hero', 'text', 'video', 'cta', 'divider', 'spacing', 'image', 'gallery', 'features', 'testimonials', 'faq', 'columns', 'contact', 'countdown', 'tabs', 'accordion'].includes(block.type) && (
        <div className="p-4 bg-gray-800/50 rounded-lg text-center text-gray-500 text-sm">
          Editor de {BLOCK_TYPES.find(t => t.type === block.type)?.label} - En desarrollo
        </div>
      )}

      {/* Block Style Editor */}
      <BlockStyleEditor
        styles={block.settings.styles || {}}
        onUpdate={(styles) => onUpdateSettings({ styles })}
      />

      {/* Block Animation Editor */}
      <BlockAnimationEditor
        animation={block.settings.animation || {}}
        onUpdate={(animation) => onUpdateSettings({ animation })}
      />
    </div>
  );
}

// Helper to convert styles object to CSS
function getStylesFromSettings(styles: Record<string, any>): React.CSSProperties {
  if (!styles || Object.keys(styles).length === 0) return {};

  const css: React.CSSProperties = {};

  if (styles.backgroundColor) css.backgroundColor = styles.backgroundColor;
  if (styles.backgroundImage) css.backgroundImage = `url(${styles.backgroundImage})`;

  if (styles.margin) {
    const m = styles.margin;
    css.margin = `${m.top || '0'} ${m.right || '0'} ${m.bottom || '0'} ${m.left || '0'}`;
  }

  if (styles.padding) {
    const p = styles.padding;
    css.padding = `${p.top || '0'} ${p.right || '0'} ${p.bottom || '0'} ${p.left || '0'}`;
  }

  if (styles.border) {
    const b = styles.border;
    if (b.width && b.width !== '0') {
      css.border = `${b.width} ${b.style || 'solid'} ${b.color || '#e5e7eb'}`;
    }
    if (b.radius && b.radius !== '0') {
      css.borderRadius = b.radius;
    }
  }

  if (styles.shadow) {
    const s = styles.shadow;
    if (s.blur && s.blur !== '0') {
      css.boxShadow = `${s.offsetX || '0'} ${s.offsetY || '0'} ${s.blur} ${s.spread || '0'} ${s.color || 'rgba(0,0,0,0.1)'}`;
    }
  }

  return css;
}

// Block Preview Component
function BlockPreview({ block }: { block: LandingPageBlock }) {
  const customStyles = getStylesFromSettings(block.settings?.styles);

  switch (block.type) {
    case 'hero':
      return (
        <div
          className="p-8 text-center"
          style={{ ...customStyles, backgroundColor: block.settings.backgroundColor || '#16a34a', color: block.settings.textColor || '#ffffff' }}
        >
          <h2 className="text-xl font-bold mb-2">{block.content.title}</h2>
          <p className="text-sm opacity-90 mb-4">{block.content.subtitle}</p>
          {block.content.buttonText && (
            <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
              {block.content.buttonText}
            </span>
          )}
        </div>
      );
    case 'text':
      return (
        <div className="p-4" style={customStyles}>
          {block.content.heading && <h3 className="font-semibold mb-2">{block.content.heading}</h3>}
          <p className="text-sm text-gray-600">{block.content.body}</p>
        </div>
      );
    case 'video':
      return (
        <div className="p-4 bg-gray-100 text-center">
          <Video size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-xs text-gray-500">Video: {block.content.url || 'Sin URL'}</p>
        </div>
      );
    case 'cta':
      return (
        <div className="p-4 text-center">
          <span
            className="inline-block px-6 py-3 rounded-lg text-sm font-medium"
            style={{ backgroundColor: block.content.backgroundColor || '#16a34a', color: block.content.textColor || '#ffffff' }}
          >
            {block.content.text}
          </span>
        </div>
      );
    case 'divider':
      return (
        <div className="p-4">
          <hr
            style={{
              borderStyle: block.content.style || 'solid',
              borderColor: block.content.color || '#374151',
              borderWidth: `${block.content.thickness || 1}px`,
            }}
          />
        </div>
      );
    case 'spacing':
      return <div style={{ height: `${block.content.height || 60}px` }} />;
    case 'contact':
      return <ContactFormBlockPreview content={block.content} />;
    case 'countdown':
      return <CountdownBlockPreview content={block.content} />;
    case 'tabs':
      return <TabsBlockPreview content={block.content} />;
    case 'accordion':
      return <AccordionBlockPreview content={block.content} />;
    case 'columns':
      return (
        <div className="p-4">
          <div className="flex gap-3">
            {(block.content.columns || []).map((col: any, index: number) => (
              <div key={index} className="flex-1" style={{ flex: `0 0 ${col.width || 50}%` }}>
                {col.title && <h4 className="font-semibold text-sm mb-1">{col.title}</h4>}
                <p className="text-xs text-gray-600">{col.content}</p>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className="p-4 bg-gray-50 text-center text-gray-400 text-xs">
          {BLOCK_TYPES.find(t => t.type === block.type)?.label}
        </div>
      );
  }
}
