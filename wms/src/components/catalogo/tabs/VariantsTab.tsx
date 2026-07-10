'use client';

import { useProductForm, Variant } from '../ProductFormContext';
import { useCategoryAttributes, CategoryAttribute } from '@/hooks/useCategoryAttributes';
import ImageUploader from '../ui/ImageUploader';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Palette, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function VariantsTab() {
  const { variants, variantPricingMode, prices, categoryId, addVariant, updateVariant, removeVariant } = useProductForm();
  const { attributes: categoryAttributes } = useCategoryAttributes(categoryId);
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedVariant(expandedVariant === id ? null : id);
  };

  const updateVariantAttribute = (variantId: string, attrName: string, value: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;
    const newAttributes = { ...variant.attributes, [attrName]: value };
    updateVariant(variantId, { attributes: newAttributes });
  };

  // Generate attribute summary for variant header
  const getAttributeSummary = (variant: Variant) => {
    if (!variant.attributes || Object.keys(variant.attributes).length === 0) return null;
    return Object.entries(variant.attributes)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
  };

  // Check if required attributes are filled
  const validateVariant = (variant: Variant): string[] => {
    const errors: string[] = [];
    categoryAttributes.forEach(attr => {
      if (attr.required && !variant.attributes?.[attr.name]) {
        errors.push(attr.name);
      }
    });
    return errors;
  };

  // Generate color swatch for color attributes
  const renderColorSwatch = (value: string) => {
    if (!value) return null;
    return (
      <div
        className="w-4 h-4 rounded-full border border-gray-600"
        style={{ backgroundColor: value }}
        title={value}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Category Info */}
      {categoryAttributes.length > 0 && (
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3">
          <p className="text-xs text-brand-400">
            <strong>{categoryAttributes.length} atributos</strong> configurados para esta categoria:
            {' '}{categoryAttributes.map(a => a.name).join(', ')}
          </p>
        </div>
      )}

      {/* Add Variant Button */}
      <button
        type="button"
        onClick={addVariant}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-700 rounded-xl text-sm text-gray-400 hover:border-brand-500 hover:text-brand-400 transition-colors"
      >
        <Plus size={18} />
        Agregar variante
      </button>

      {/* Variants List */}
      {variants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No hay variantes</p>
          <p className="text-xs mt-1">Haz clic en "Agregar variante" para comenzar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, index) => {
            const errors = validateVariant(variant);
            const attrSummary = getAttributeSummary(variant);

            return (
              <div
                key={variant.id}
                className={`bg-gray-800 border rounded-xl overflow-hidden transition-colors ${
                  errors.length > 0 ? 'border-yellow-500/50' : 'border-gray-700'
                }`}
              >
                {/* Variant Header */}
                <div className="flex items-center gap-3 p-4">
                  <GripVertical size={16} className="text-gray-600 cursor-move" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500">{variant.sku}</span>
                      {errors.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-yellow-400">
                          <AlertCircle size={10} />
                          {errors.length} campo(s) requerido(s)
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                      className="w-full mt-1 bg-transparent text-white text-sm font-medium focus:outline-none"
                      placeholder="Nombre de variante"
                    />
                    {/* Attribute Summary */}
                    {attrSummary && expandedVariant !== variant.id && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{attrSummary}</p>
                    )}
                  </div>

                  {/* Color Swatch Preview */}
                  {variant.attributes?.color && (
                    <div className="flex items-center gap-2">
                      {renderColorSwatch(variant.attributes.color)}
                      <span className="text-xs text-gray-400">{variant.attributes.color}</span>
                    </div>
                  )}

                  {variantPricingMode === 'individual' && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500">Precio</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">S/</span>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) => updateVariant(variant.id, { price: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="0.01"
                          className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  )}

                  {variantPricingMode === 'same' && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500">Precio</span>
                      <p className="text-sm font-medium text-brand-400">S/ {prices.main}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleExpand(variant.id)}
                    className="p-1 text-gray-500 hover:text-white"
                  >
                    {expandedVariant === variant.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeVariant(variant.id)}
                    className="p-1 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Expanded Content */}
                {expandedVariant === variant.id && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-700">
                    {/* Category Attributes */}
                    {categoryAttributes.length > 0 && (
                      <div className="pt-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Palette size={14} className="text-brand-400" />
                          <label className="text-xs font-medium text-gray-400">Atributos de Categoria</label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {categoryAttributes.map((attr) => {
                            const hasError = attr.required && !variant.attributes?.[attr.name];
                            return (
                              <div key={attr.name}>
                                <label className="block text-xs text-gray-500 mb-1">
                                  {attr.name} {attr.required && <span className="text-red-400">*</span>}
                                </label>
                                {attr.type === 'select' ? (
                                  <select
                                    value={variant.attributes?.[attr.name] || ''}
                                    onChange={(e) => updateVariantAttribute(variant.id, attr.name, e.target.value)}
                                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                                      hasError ? 'border-yellow-500' : 'border-gray-600'
                                    }`}
                                  >
                                    <option value="">Seleccionar...</option>
                                    {attr.options?.map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : attr.type === 'color' ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={variant.attributes?.[attr.name] || '#000000'}
                                      onChange={(e) => updateVariantAttribute(variant.id, attr.name, e.target.value)}
                                      className="w-10 h-10 rounded-lg border border-gray-600 cursor-pointer"
                                    />
                                    <input
                                      type="text"
                                      value={variant.attributes?.[attr.name] || ''}
                                      onChange={(e) => updateVariantAttribute(variant.id, attr.name, e.target.value)}
                                      placeholder="#000000"
                                      className={`flex-1 px-3 py-2 bg-gray-700 border rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                                        hasError ? 'border-yellow-500' : 'border-gray-600'
                                      }`}
                                    />
                                  </div>
                                ) : attr.type === 'number' ? (
                                  <input
                                    type="number"
                                    value={variant.attributes?.[attr.name] || ''}
                                    onChange={(e) => updateVariantAttribute(variant.id, attr.name, e.target.value)}
                                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                                      hasError ? 'border-yellow-500' : 'border-gray-600'
                                    }`}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={variant.attributes?.[attr.name] || ''}
                                    onChange={(e) => updateVariantAttribute(variant.id, attr.name, e.target.value)}
                                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                                      hasError ? 'border-yellow-500' : 'border-gray-600'
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Compare At Price */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Precio de comparacion (opcional)</label>
                      <div className="relative w-40">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">S/</span>
                        <input
                          type="number"
                          value={variant.compareAtPrice || ''}
                          onChange={(e) => updateVariant(variant.id, { compareAtPrice: parseFloat(e.target.value) || null })}
                          min="0"
                          step="0.01"
                          className="w-full pl-7 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Images */}
                    <ImageUploader
                      images={variant.images}
                      onImagesChange={(images) => updateVariant(variant.id, { images })}
                      label={`Imagenes de ${variant.name}`}
                    />

                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={variant.isActive}
                          onChange={(e) => updateVariant(variant.id, { isActive: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                      <span className="text-sm text-gray-300">
                        {variant.isActive ? 'Variante activa' : 'Variante inactiva'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
