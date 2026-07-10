'use client';

import { useState } from 'react';
import { useProductForm } from '../ProductFormContext';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/FormField';
import CharacterCounter from '../ui/CharacterCounter';
import ImageUploader from '../ui/ImageUploader';
import { X, Plus, Weight, Ruler, Palette, Box, Calendar, Shield, Globe, Tag, Eye, EyeOff, Star } from 'lucide-react';

interface InfoTabProps {
  categories: Array<{ id: string; name: string }>;
}

// Optional fields with their toggle state - all ON by default
const optionalFields = [
  { key: 'model', label: 'Modelo', icon: Box },
  { key: 'brand', label: 'Marca', icon: Tag },
  { key: 'dimensions', label: 'Dimensiones', icon: Ruler },
  { key: 'color', label: 'Color', icon: Palette },
  { key: 'materials', label: 'Materiales', icon: Box },
  { key: 'recommendedAge', label: 'Edad Recomendada', icon: Calendar },
  { key: 'warrantyDays', label: 'Garantia', icon: Shield },
  { key: 'originCountry', label: 'Origen', icon: Globe },
  { key: 'weight', label: 'Peso', icon: Weight },
  { key: 'tags', label: 'Etiquetas', icon: Tag },
];

export default function InfoTab({ categories }: InfoTabProps) {
  const {
    sku, name, model, description, shortDescription, brand, categoryId, status, tags,
    dimensions, color, materials, recommendedAge, warrantyDays, originCountry,
    weight, weightUnit, productImages, mainImageIndex,
    updateField, updateDimensions, addMaterial, removeMaterial, setMainImage
  } = useProductForm();

  // Toggle state for optional fields - all ON by default
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({
    model: true,
    brand: true,
    dimensions: true,
    color: true,
    materials: true,
    recommendedAge: true,
    warrantyDays: true,
    originCountry: true,
    weight: true,
    tags: true,
  });

  const [tagInput, setTagInput] = useState('');
  const [materialInput, setMaterialInput] = useState('');

  const toggleField = (key: string) => {
    setVisibleFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      updateField('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateField('tags', tags.filter(t => t !== tag));
  };

  const addMaterialHandler = () => {
    if (materialInput.trim() && !materials.includes(materialInput.trim())) {
      addMaterial(materialInput.trim());
      setMaterialInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toggle Bar */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Eye size={14} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-400">Campos opcionales</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {optionalFields.map((field) => {
            const Icon = field.icon;
            const isVisible = visibleFields[field.key];
            return (
              <button
                key={field.key}
                type="button"
                onClick={() => toggleField(field.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isVisible
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                    : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600'
                }`}
              >
                {isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
                <Icon size={10} />
                {field.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Required Fields */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Informacion basica</h3>

        {/* SKU */}
        <FormInput
          label="SKU"
          value={sku}
          onChange={(e) => updateField('sku', e.target.value)}
          placeholder="Auto-generado si se deja vacio"
          hint="Se genera automaticamente basado en la categoria"
        />

        {/* Nombre */}
        <FormInput
          label="Nombre"
          value={name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Nombre del producto"
          required
        />

        {/* Categoria */}
        <FormSelect
          label="Categoria"
          value={categoryId}
          onChange={(e) => updateField('categoryId', e.target.value)}
          options={[
            { value: '', label: 'Seleccionar categoria...' },
            ...categories.map(cat => ({ value: cat.id, label: cat.name })),
          ]}
          required
        />

        {/* Estado */}
        <FormSelect
          label="Estado"
          value={status}
          onChange={(e) => updateField('status', e.target.value)}
          options={[
            { value: 'draft', label: 'Borrador' },
            { value: 'active', label: 'Activo' },
            { value: 'archived', label: 'Archivado' },
          ]}
        />

        {/* Descripcion */}
        <div className="space-y-1">
          <FormTextarea
            label="Descripcion"
            value={description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Descripcion detallada del producto..."
            rows={4}
          />
          <CharacterCounter current={description.length} max={500} />
        </div>

        {/* Descripcion Corta */}
        <div className="space-y-1">
          <FormTextarea
            label="Descripcion Corta"
            value={shortDescription}
            onChange={(e) => updateField('shortDescription', e.target.value)}
            placeholder="Breve descripcion para vista previa..."
            rows={2}
          />
          <CharacterCounter current={shortDescription.length} max={250} />
        </div>
      </div>

      {/* Product Images */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Imagenes del Producto</h3>
        <p className="text-xs text-gray-500">Maximo 5 imagenes. La imagen principal se muestra en la tienda.</p>

        <ImageUploader
          images={productImages}
          onImagesChange={(images) => {
            // Sync images and maintain mainImageIndex
            updateField('productImages', images);
          }}
          label="Imagenes del producto"
        />

        {/* Main Image Selector */}
        {productImages.length > 1 && (
          <div className="space-y-2">
            <label className="text-xs text-gray-500">Imagen principal</label>
            <div className="flex gap-2 flex-wrap">
              {productImages.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setMainImage(index)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    mainImageIndex === index
                      ? 'border-green-500 ring-2 ring-green-500/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  {mainImageIndex === index && (
                    <div className="absolute top-0.5 left-0.5 p-0.5 bg-green-500 rounded">
                      <Star size={8} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {productImages.length === 1 && (
          <p className="text-xs text-green-400 flex items-center gap-1">
            <Star size={10} />
            La unica imagen sera la principal
          </p>
        )}
      </div>

      {/* Optional Fields */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Detalles adicionales</h3>

        {/* Modelo */}
        {visibleFields.model && (
          <FormInput
            label="Modelo"
            value={model}
            onChange={(e) => updateField('model', e.target.value)}
            placeholder="Codigo de modelo"
          />
        )}

        {/* Marca */}
        {visibleFields.brand && (
          <FormInput
            label="Marca"
            value={brand}
            onChange={(e) => updateField('brand', e.target.value)}
            placeholder="Marca del producto"
          />
        )}

        {/* Dimensiones */}
        {visibleFields.dimensions && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Dimensiones (cm)</label>
            <div className="grid grid-cols-3 gap-3">
              <FormInput
                label="Alto"
                type="number"
                value={dimensions.height?.toString() || ''}
                onChange={(e) => updateDimensions({ height: parseFloat(e.target.value) || null })}
                placeholder="0"
              />
              <FormInput
                label="Ancho"
                type="number"
                value={dimensions.width?.toString() || ''}
                onChange={(e) => updateDimensions({ width: parseFloat(e.target.value) || null })}
                placeholder="0"
              />
              <FormInput
                label="Profundidad"
                type="number"
                value={dimensions.depth?.toString() || ''}
                onChange={(e) => updateDimensions({ depth: parseFloat(e.target.value) || null })}
                placeholder="0"
              />
            </div>
          </div>
        )}

        {/* Color */}
        {visibleFields.color && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color || '#000000'}
                onChange={(e) => updateField('color', e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => updateField('color', e.target.value)}
                placeholder="#FF5733 o nombre del color"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        )}

        {/* Materiales */}
        {visibleFields.materials && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Materiales</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={materialInput}
                onChange={(e) => setMaterialInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterialHandler())}
                placeholder="Agregar material..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={addMaterialHandler}
                disabled={!materialInput.trim()}
                className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
            {materials.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {materials.map((mat) => (
                  <span
                    key={mat}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300"
                  >
                    {mat}
                    <button
                      type="button"
                      onClick={() => removeMaterial(mat)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edad Recomendada */}
        {visibleFields.recommendedAge && (
          <FormInput
            label="Edad Recomendada"
            value={recommendedAge}
            onChange={(e) => updateField('recommendedAge', e.target.value)}
            placeholder="0-12 meses, 1-3 años, etc."
          />
        )}

        {/* Garantia */}
        {visibleFields.warrantyDays && (
          <FormInput
            label="Garantia (dias)"
            type="number"
            value={warrantyDays?.toString() || ''}
            onChange={(e) => updateField('warrantyDays', parseInt(e.target.value) || null)}
            placeholder="365"
            hint="Numero de dias de garantia"
          />
        )}

        {/* Origen */}
        {visibleFields.originCountry && (
          <FormInput
            label="Pais de Origen"
            value={originCountry}
            onChange={(e) => updateField('originCountry', e.target.value)}
            placeholder="Peru, China, etc."
          />
        )}

        {/* Peso */}
        {visibleFields.weight && (
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <FormInput
                label="Peso"
                type="number"
                value={weight?.toString() || ''}
                onChange={(e) => updateField('weight', parseFloat(e.target.value) || null)}
                placeholder="0.00"
              />
            </div>
            <div className="w-24">
              <FormSelect
                label="Unidad"
                value={weightUnit}
                onChange={(e) => updateField('weightUnit', e.target.value)}
                options={[
                  { value: 'kg', label: 'kg' },
                  { value: 'g', label: 'g' },
                ]}
              />
            </div>
          </div>
        )}

        {/* Etiquetas */}
        {visibleFields.tags && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Etiquetas</label>
            <p className="text-xs text-gray-500">Solo uso interno del WMS para filtrado</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Agregar etiqueta..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim()}
                className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
