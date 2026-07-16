'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Loader2, Eye, EyeOff, Info, Tag, Layout, History, Copy, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { ProductFormProvider, useProductForm } from './ProductFormContext';
import InfoTab from './tabs/InfoTab';
import PricingTab from './tabs/PricingTab';
import LandingPageTab from './tabs/LandingPageTab';
import ProductPreview from './preview/ProductPreview';
import VersionHistoryPanel from './ui/VersionHistoryPanel';
import TemplateSelector from './ui/TemplateSelector';

interface ProductFormProps {
  initialData?: any;
  productId?: string;
  categories: { id: string; name: string }[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

const tabs = [
  { key: 'info', label: 'Info', icon: Info },
  { key: 'pricing', label: 'Pricing', icon: Tag },
  { key: 'landing', label: 'Landing Page', icon: Layout },
];

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function ProductFormInner({ productId, categories, onSave, onCancel, mode }: Omit<ProductFormProps, 'initialData'>) {
  const form = useProductForm();
  const [saving, setSaving] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApplyTemplate = (template: any) => {
    // Apply template defaults
    if (template.defaults) {
      Object.entries(template.defaults).forEach(([key, value]) => {
        if (key === 'dimensions') {
          form.updateDimensions(value as any);
        } else {
          form.updateField(key as any, value);
        }
      });
    }

    // Apply category attributes if available
    // These would be saved to the category when the user selects a category
  };

  const handleDuplicate = useCallback(async () => {
    if (!productId) return;
    setDuplicating(true);
    try {
      const res = await fetch(`/api/v1/products/${productId}/duplicate`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        // Close current form and open the duplicated product
        onCancel();
        // You could navigate to the new product or refresh the list
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to duplicate product:', err);
    }
    setDuplicating(false);
  }, [productId, onCancel]);

  const handleSave = useCallback(async (status?: string) => {
    if (!form.name) { console.error('[Save] No name'); return; }
    setSaving(true);

    try {
      const slug = form.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const savedData = {
        sku: form.sku || undefined,
        name: form.name,
        slug,
        model: form.model,
        description: form.description,
        shortDescription: form.shortDescription,
        brand: form.brand,
        categoryId: form.categoryId,
        status: status || form.status,
        tags: form.tags,
        height: form.dimensions.height,
        width: form.dimensions.width,
        depth: form.dimensions.depth,
        color: form.color,
        materials: form.materials,
        recommendedAge: form.recommendedAge,
        warrantyDays: form.warrantyDays,
        originCountry: form.originCountry,
        weight: form.weight,
        weightUnit: form.weightUnit,
        stock: form.stock,
        lowStockAlert: form.lowStockAlert,
        price: form.price,
        compareAtPrice: form.compareAtPrice,
        discountPercent: form.discountPercent,
        costPrice: form.costPrice,
        barcode: form.barcode,
        discountPopup: form.discountPopup,
        images: form.productImages,
        mainImageIndex: form.mainImageIndex,
        ctaText: form.ctaText,
        crossSellProductIds: form.crossSellProductIds,
      };

      await onSave(savedData);

      // Save landing page blocks (also handles clearing blocks)
      if (slug) {
        await fetch(`/api/v1/landings/${slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocks: form.landingBlocks }),
        });
      }

      form.markClean();
      setSaveMessage({ type: 'success', text: 'Producto guardado' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('[Save] Error:', error);
      setSaveMessage({ type: 'error', text: 'Error al guardar' });
      setTimeout(() => setSaveMessage(null), 5000);
    }

    setSaving(false);
  }, [form, mode, onSave, productId]);

  const handleCancel = useCallback(() => {
    if (form.isDirty) {
      setShowUnsavedDialog(true);
    } else {
      onCancel();
    }
  }, [form.isDirty, onCancel]);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={handleCancel}
            className="p-1.5 md:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xs md:text-sm font-semibold text-white truncate">
              {mode === 'create' ? 'Nuevo Producto' : form.name || 'Editar Producto'}
            </h1>
            <p className="text-[10px] md:text-xs text-gray-500 hidden sm:block">
              {form.sku && `SKU: ${form.sku}`}
              {form.isDirty && ' (sin guardar)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* Auto-save status - hidden on small mobile */}
          {form.autoSaveStatus === 'saving' && (
            <span className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-xs text-yellow-400 bg-yellow-500/10 rounded-lg">
              <Loader2 size={12} className="animate-spin" />
              Guardando...
            </span>
          )}
          {form.autoSaveStatus === 'saved' && (
            <span className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-xs text-green-400 bg-green-500/10 rounded-lg">
              Guardado {form.lastSavedAt && `hace ${getTimeAgo(form.lastSavedAt)}`}
            </span>
          )}

          {/* Template Button */}
          {mode === 'create' && (
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="p-1.5 md:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Cargar plantilla"
            >
              <FileText size={14} />
            </button>
          )}

          {/* Preview Toggle */}
          <button
            onClick={form.togglePreview}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              form.showPreview
                ? 'bg-brand-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {form.showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
            Preview
          </button>

          {/* Version History Button */}
          {mode === 'edit' && (
            <button
              onClick={() => setShowVersionHistory(true)}
              className="p-1.5 md:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Historial de versiones"
            >
              <History size={14} />
            </button>
          )}

          {mode === 'edit' && (
            <button
              onClick={handleDuplicate}
              disabled={duplicating}
              className="p-1.5 md:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              title="Duplicar producto"
            >
              {duplicating ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
            </button>
          )}

          {mode === 'edit' && form.status === 'draft' && (
            <button
              onClick={() => handleSave('active')}
              disabled={saving || !form.name}
              className="hidden sm:flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors"
            >
              Publicar
            </button>
          )}

          <button
            onClick={() => handleSave()}
            disabled={saving || !form.name}
            className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span className="hidden sm:inline">Guardar</span>
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-2 md:px-4 py-2 bg-gray-900/50 border-b border-gray-800 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => form.setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
                form.activeTab === tab.key
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Form Panel */}
        <div className={`flex-1 overflow-y-auto ${form.showPreview ? 'max-w-[60%]' : 'max-w-4xl mx-auto'}`}>
          <div className="p-3 md:p-6">
            {form.activeTab === 'info' && <InfoTab categories={categories} />}
            {form.activeTab === 'pricing' && <PricingTab />}
            {form.activeTab === 'landing' && <LandingPageTab slug={form.name?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''} />}
          </div>
        </div>

        {/* Preview Panel */}
        {form.showPreview && (
          <div className="w-[40%] border-l border-gray-800 overflow-y-auto bg-gray-950">
            <div className="sticky top-0 p-4">
              <ProductPreview />
            </div>
          </div>
        )}
      </div>

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">Cambios sin guardar</h3>
            <p className="text-sm text-gray-400 mb-6">
              Tienes cambios sin guardar. Si sales, se perderan los cambios no guardados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnsavedDialog(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Salir sin guardar
              </button>
              <button
                onClick={async () => { await handleSave(); onCancel(); }}
                className="flex-1 px-4 py-2 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700"
              >
                Guardar y salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Toast */}
      {saveMessage && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
          saveMessage.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {saveMessage.type === 'success' ? (
              <CheckCircle size={14} />
            ) : (
              <AlertCircle size={14} />
            )}
            {saveMessage.text}
            {saveMessage.type === 'success' && productId && (
              <button
                onClick={() => setShowVersionHistory(true)}
                className="ml-2 underline text-white/80 hover:text-white"
              >
                Ver historial
              </button>
            )}
          </div>
        </div>
      )}

      {/* Version History Panel */}
      <VersionHistoryPanel
        productId={productId || ''}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestore={(versionId) => {
          // Reload form data after restore
          window.location.reload();
        }}
      />

      {/* Template Selector */}
      {showTemplateSelector && (
        <TemplateSelector
          onSelect={handleApplyTemplate}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
}

export default function ProductForm({ initialData, productId, categories, onSave, onCancel, mode }: ProductFormProps) {
  return (
    <ProductFormProvider initialData={initialData} productId={productId}>
      <ProductFormInner productId={productId} categories={categories} onSave={onSave} onCancel={onCancel} mode={mode} />
    </ProductFormProvider>
  );
}
