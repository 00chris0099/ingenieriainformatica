'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface LandingPageBlock {
  id: string;
  type: 'hero' | 'text' | 'image' | 'gallery' | 'video' | 'features' | 'cta' | 'testimonials' | 'faq' | 'columns' | 'divider' | 'spacing' | 'contact' | 'countdown' | 'tabs' | 'accordion';
  settings: Record<string, any>;
  content: Record<string, any>;
}

export interface DiscountPopupConfig {
  enabled: boolean;
  title: string;
  description: string;
  discountPercent: number;
  discountAmount: number | null; // Fixed discount in soles (null = use percent)
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
  bgColor: string;
  textColor: string;
}

export interface PromotionBarConfig {
  enabled: boolean;
  message: string;
  hours: number; // horas de countdown
  bgColor: string;
  textColor: string;
}

export interface SocialProofAvatar {
  id: string;
  imageUrl: string;
  name: string;
  city: string;
}

export interface SocialProofConfig {
  enabled: boolean;
  interval: number;
  messages: string[];
  avatars: SocialProofAvatar[];
}

export interface ProductDimensions {
  height: number | null;
  width: number | null;
  depth: number | null;
}

interface ProductFormState {
  // Basic info
  sku: string;
  name: string;
  slug: string;
  model: string;
  description: string;
  shortDescription: string;
  brand: string;
  categoryId: string;
  status: string;
  tags: string[];

  // Product images
  productImages: string[];
  mainImageIndex: number;

  // Dimensions
  dimensions: ProductDimensions;

  // Additional attributes
  color: string;
  materials: string[];
  recommendedAge: string;
  warrantyDays: number | null;
  originCountry: string;

  // Weight
  weight: number | null;
  weightUnit: string;

  // Stock
  stock: number;
  lowStockAlert: number | null;

  // Pricing (simple, on Product directly)
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  costPrice: number | null;
  barcode: string;

  // Discount popup
  discountPopup: DiscountPopupConfig;

  // CTA & Cross-sell
  ctaText: string;
  crossSellProductIds: string[];

  // Urgency / Promoción
  promotionBar: PromotionBarConfig;
  socialProof: SocialProofConfig;

  // UI state
  activeTab: string;
  activeView: 'edit' | 'preview';
  previewMode: 'web' | 'mobile';
  showPreview: boolean;
  isDirty: boolean;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;

  // Landing page blocks
  landingBlocks: LandingPageBlock[];

  // Version history
  versionHistory: any[];
  showVersionHistory: boolean;
}

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface ProductFormContextType extends ProductFormState {
  // Product ID
  productId?: string;

  // Field updates
  updateField: <K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) => void;
  updateDimensions: (dims: Partial<ProductDimensions>) => void;

  // Materials
  addMaterial: (material: string) => void;
  removeMaterial: (material: string) => void;

  // Product images
  addProductImage: (url: string) => void;
  removeProductImage: (index: number) => void;
  setMainImage: (index: number) => void;
  moveProductImage: (from: number, to: number) => void;

  // Discount popup
  updateDiscountPopup: (config: Partial<DiscountPopupConfig>) => void;
  toggleDiscountPopup: () => void;

  // CTA & Cross-sell
  setCtaText: (text: string) => void;
  setCrossSellProductIds: (ids: string[]) => void;
  addCrossSellProduct: (id: string) => void;
  removeCrossSellProduct: (id: string) => void;

  // Urgency / Promoción
  updatePromotionBar: (config: Partial<PromotionBarConfig>) => void;
  togglePromotionBar: () => void;
  updateSocialProof: (config: Partial<SocialProofConfig>) => void;
  toggleSocialProof: () => void;

  // UI
  setActiveTab: (tab: string) => void;
  setActiveView: (view: 'edit' | 'preview') => void;
  setPreviewMode: (mode: 'web' | 'mobile') => void;
  togglePreview: () => void;

  // Landing page
  setLandingBlocks: (blocks: LandingPageBlock[]) => void;
  addLandingBlock: (block: LandingPageBlock) => void;
  updateLandingBlock: (id: string, updates: Partial<LandingPageBlock>) => void;
  removeLandingBlock: (id: string) => void;
  moveLandingBlock: (from: number, to: number) => void;
  duplicateLandingBlock: (id: string) => void;

  // Version history
  setShowVersionHistory: (show: boolean) => void;
  loadVersionHistory: (productId: string) => Promise<void>;

  // Auto-save
  triggerAutoSave: (productId: string) => void;

  // State management
  markDirty: () => void;
  markClean: () => void;
  resetForm: (data?: Partial<ProductFormState>) => void;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const defaultDiscountPopup: DiscountPopupConfig = {
  enabled: false,
  title: 'Oferta especial!',
  description: 'Obtén un descuento exclusivo en este producto',
  discountPercent: 10,
  discountAmount: null,
  ctaText: 'Comprar ahora',
  ctaUrl: '#',
  imageUrl: '',
  bgColor: '#16a34a',
  textColor: '#ffffff',
};

const defaultDimensions: ProductDimensions = {
  height: null,
  width: null,
  depth: null,
};

const defaultPromotionBar: PromotionBarConfig = {
  enabled: false,
  message: '¡Oferta por tiempo limitado! Quedan {hours}h {minutes}m {seconds}s',
  hours: 24,
  bgColor: '#dc2626',
  textColor: '#ffffff',
};

const MIGRATION_NAMES = ['María', 'Carlos', 'Ana', 'Luis', 'Rosa', 'Jorge', 'Claudia', 'Pedro', 'Sofía', 'Miguel', 'Elena', 'Fernando', 'Patricia', 'Roberto', 'Diana', 'Andrés', 'Carmen'];
const MIGRATION_CITIES = ['Lima', 'Arequipa', 'Cusco', 'Trujillo', 'Piura', 'Chiclayo', 'Ica', 'Huancayo', 'Lima', 'Cusco', 'Arequipa', 'Trujillo', 'Lima', 'Piura', 'Chiclayo', 'Ica', 'Huancayo'];

const IMGBB_MAP: Record<string, string> = {
  'Abigail.jpg': 'https://i.ibb.co/p6f3nnyJ/1bcce3d3e809.jpg',
  'Alejandro.jpg': 'https://i.ibb.co/G4g4qY37/075e42a1079e.jpg',
  'Benjamin.jpg': 'https://i.ibb.co/0pYsJLY0/491bdc467f21.jpg',
  'Daniela.jpg': 'https://i.ibb.co/4ngqxGqk/b3cba795ec88.jpg',
  'Eric.jpg': 'https://i.ibb.co/35gfjYyN/581bb8e07080.jpg',
  'jeremy.jpg': 'https://i.ibb.co/MkrVRHPp/a680ac24ecf5.jpg',
  'juan.jpg': 'https://i.ibb.co/Z1H2pbC5/eabd331a6c08.jpg',
  'Liliana.jpg': 'https://i.ibb.co/DDfVsfKB/3bfbe0a72485.jpg',
  'lucas.jpg': 'https://i.ibb.co/Vc7xkG8J/292503f6281b.jpg',
  'martina.jpg': 'https://i.ibb.co/NgP4CTsQ/fc4f09c61a0a.jpg',
  'mateo.jpg': 'https://i.ibb.co/fYhLFh3z/ef852dafb6b5.jpg',
  'melina.jpg': 'https://i.ibb.co/QFXwr5n0/58c6546cd8ba.jpg',
  'santiago.jpg': 'https://i.ibb.co/j9CXN103/15696c5cdb75.jpg',
  'sofia.jpg': 'https://i.ibb.co/MD1PGSxL/569b2641fba8.jpg',
  'thiago.jpg': 'https://i.ibb.co/gL8mJKNV/5ef70ab02ebf.jpg',
  'valentino.jpg': 'https://i.ibb.co/cnfgb57/2f670c2d4f69.jpg',
  'zoey.jpg': 'https://i.ibb.co/WWzkn4rw/d29931d44c37.jpg',
};

function resolveAvatarUrl(url: string): string {
  if (url.startsWith('http')) return url;
  const filename = url.split('/').pop() || '';
  return IMGBB_MAP[filename] || url;
}

const defaultSocialProof: SocialProofConfig = {
  enabled: false,
  interval: 5,
  messages: [
    '{name} de {city} compró este producto',
    '{name} de {city} acabó de comprar',
    '{name} de {city} se lo llevó',
  ],
  avatars: [
    { id: '1', imageUrl: 'https://i.ibb.co/p6f3nnyJ/1bcce3d3e809.jpg', name: 'Abigail', city: 'Lima' },
    { id: '2', imageUrl: 'https://i.ibb.co/G4g4qY37/075e42a1079e.jpg', name: 'Alejandro', city: 'Arequipa' },
    { id: '3', imageUrl: 'https://i.ibb.co/0pYsJLY0/491bdc467f21.jpg', name: 'Benjamin', city: 'Cusco' },
    { id: '4', imageUrl: 'https://i.ibb.co/4ngqxGqk/b3cba795ec88.jpg', name: 'Daniela', city: 'Trujillo' },
    { id: '5', imageUrl: 'https://i.ibb.co/35gfjYyN/581bb8e07080.jpg', name: 'Eric', city: 'Lima' },
    { id: '6', imageUrl: 'https://i.ibb.co/MkrVRHPp/a680ac24ecf5.jpg', name: 'Jeremy', city: 'Piura' },
    { id: '7', imageUrl: 'https://i.ibb.co/Z1H2pbC5/eabd331a6c08.jpg', name: 'Juan', city: 'Chiclayo' },
    { id: '8', imageUrl: 'https://i.ibb.co/DDfVsfKB/3bfbe0a72485.jpg', name: 'Liliana', city: 'Ica' },
    { id: '9', imageUrl: 'https://i.ibb.co/Vc7xkG8J/292503f6281b.jpg', name: 'Lucas', city: 'Huancayo' },
    { id: '10', imageUrl: 'https://i.ibb.co/NgP4CTsQ/fc4f09c61a0a.jpg', name: 'Martina', city: 'Lima' },
    { id: '11', imageUrl: 'https://i.ibb.co/fYhLFh3z/ef852dafb6b5.jpg', name: 'Mateo', city: 'Cusco' },
    { id: '12', imageUrl: 'https://i.ibb.co/QFXwr5n0/58c6546cd8ba.jpg', name: 'Melina', city: 'Arequipa' },
    { id: '13', imageUrl: 'https://i.ibb.co/j9CXN103/15696c5cdb75.jpg', name: 'Santiago', city: 'Lima' },
    { id: '14', imageUrl: 'https://i.ibb.co/MD1PGSxL/569b2641fba8.jpg', name: 'Sofía', city: 'Trujillo' },
    { id: '15', imageUrl: 'https://i.ibb.co/gL8mJKNV/5ef70ab02ebf.jpg', name: 'Thiago', city: 'Piura' },
    { id: '16', imageUrl: 'https://i.ibb.co/cnfgb57/2f670c2d4f69.jpg', name: 'Valentino', city: 'Chiclayo' },
    { id: '17', imageUrl: 'https://i.ibb.co/WWzkn4rw/d29931d44c37.jpg', name: 'Zoey', city: 'Lima' },
  ],
};

// ============================================================================
// CONTEXT
// ============================================================================

const ProductFormContext = createContext<ProductFormContextType | null>(null);

export function useProductForm() {
  const context = useContext(ProductFormContext);
  if (!context) throw new Error('useProductForm must be used within ProductFormProvider');
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface ProductFormProviderProps {
  initialData?: Partial<ProductFormState>;
  productId?: string;
  onAutoSave?: (data: any) => Promise<void>;
  children: React.ReactNode;
}

export function ProductFormProvider({ initialData, productId, onAutoSave, children }: ProductFormProviderProps) {
  const [state, setState] = useState<ProductFormState>(() => ({
    // Basic info
    sku: initialData?.sku || '',
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    model: initialData?.model || '',
    description: initialData?.description || '',
    shortDescription: initialData?.shortDescription || '',
    brand: initialData?.brand || '',
    categoryId: initialData?.categoryId || '',
    status: initialData?.status || 'active',
    tags: initialData?.tags || [],

    // Product images
    productImages: initialData?.productImages || [],
    mainImageIndex: initialData?.mainImageIndex || 0,

    // Dimensions
    dimensions: initialData?.dimensions || defaultDimensions,

    // Additional attributes
    color: initialData?.color || '',
    materials: initialData?.materials || [],
    recommendedAge: initialData?.recommendedAge || '',
    warrantyDays: initialData?.warrantyDays ?? null,
    originCountry: initialData?.originCountry || '',

    // Weight
    weight: initialData?.weight ?? null,
    weightUnit: initialData?.weightUnit || 'kg',

    // Stock
    stock: initialData?.stock ?? 0,
    lowStockAlert: initialData?.lowStockAlert ?? null,

    // Pricing
    price: initialData?.price ?? 0,
    compareAtPrice: initialData?.compareAtPrice ?? null,
    discountPercent: initialData?.discountPercent ?? 0,
    costPrice: initialData?.costPrice ?? null,
    barcode: initialData?.barcode || '',

    // Discount popup
    discountPopup: initialData?.discountPopup || defaultDiscountPopup,

    // CTA & Cross-sell
    ctaText: initialData?.ctaText || '¡Lo quiero ahora!',
    crossSellProductIds: initialData?.crossSellProductIds || [],

    // Urgency / Promoción
    promotionBar: initialData?.promotionBar || defaultPromotionBar,
    socialProof: (() => {
      const sp = initialData?.socialProof;
      if (!sp) return defaultSocialProof;
      if (sp.avatars) return { ...sp, avatars: sp.avatars.map((a: any) => ({ ...a, imageUrl: resolveAvatarUrl(a.imageUrl) })) };
      const old = sp as any;
      if (old.avatarFiles && Array.isArray(old.avatarFiles) && old.avatarFiles.length > 0) {
        return {
          enabled: sp.enabled,
          interval: sp.interval,
          messages: sp.messages,
          avatars: old.avatarFiles.map((f: string, i: number) => ({
            id: String(i + 1),
            imageUrl: IMGBB_MAP[f] || resolveAvatarUrl(`/avatars/${f}`),
            name: MIGRATION_NAMES[i % MIGRATION_NAMES.length],
            city: MIGRATION_CITIES[i % MIGRATION_CITIES.length],
          })),
        };
      }
      return { ...sp, avatars: defaultSocialProof.avatars };
    })(),

    // UI state
    activeTab: initialData?.activeTab || 'info',
    activeView: initialData?.activeView || 'edit',
    previewMode: initialData?.previewMode || 'web',
    showPreview: initialData?.showPreview ?? true,
    isDirty: false,
    autoSaveStatus: 'idle',
    lastSavedAt: null,

    // Landing page blocks
    landingBlocks: initialData?.landingBlocks || [],

    // Version history
    versionHistory: [],
    showVersionHistory: false,
  }));

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // ============================================================================
  // FIELD UPDATES
  // ============================================================================

  const updateField = useCallback(<K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) => {
    setState(prev => ({ ...prev, [field]: value, isDirty: true }));
  }, []);

  const updateDimensions = useCallback((dims: Partial<ProductDimensions>) => {
    setState(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, ...dims },
      isDirty: true,
    }));
  }, []);

  // ============================================================================
  // MATERIALS
  // ============================================================================

  const addMaterial = useCallback((material: string) => {
    setState(prev => {
      if (prev.materials.includes(material)) return prev;
      return { ...prev, materials: [...prev.materials, material], isDirty: true };
    });
  }, []);

  const removeMaterial = useCallback((material: string) => {
    setState(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m !== material),
      isDirty: true,
    }));
  }, []);

  // ============================================================================
  // PRODUCT IMAGES
  // ============================================================================

  const addProductImage = useCallback((url: string) => {
    setState(prev => {
      if (prev.productImages.length >= 5) return prev;
      return {
        ...prev,
        productImages: [...prev.productImages, url],
        mainImageIndex: prev.productImages.length === 0 ? 0 : prev.mainImageIndex,
        isDirty: true,
      };
    });
  }, []);

  const removeProductImage = useCallback((index: number) => {
    setState(prev => {
      const newImages = prev.productImages.filter((_, i) => i !== index);
      const newMainIndex = prev.mainImageIndex >= newImages.length
        ? Math.max(0, newImages.length - 1)
        : prev.mainImageIndex > index
          ? prev.mainImageIndex - 1
          : prev.mainImageIndex;
      return {
        ...prev,
        productImages: newImages,
        mainImageIndex: newMainIndex,
        isDirty: true,
      };
    });
  }, []);

  const setMainImage = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      mainImageIndex: index,
      isDirty: true,
    }));
  }, []);

  const moveProductImage = useCallback((from: number, to: number) => {
    setState(prev => {
      const newImages = [...prev.productImages];
      const [moved] = newImages.splice(from, 1);
      newImages.splice(to, 0, moved);
      let newMainIndex = prev.mainImageIndex;
      if (from === prev.mainImageIndex) {
        newMainIndex = to;
      } else if (from < prev.mainImageIndex && to >= prev.mainImageIndex) {
        newMainIndex--;
      } else if (from > prev.mainImageIndex && to <= prev.mainImageIndex) {
        newMainIndex++;
      }
      return {
        ...prev,
        productImages: newImages,
        mainImageIndex: newMainIndex,
        isDirty: true,
      };
    });
  }, []);

  // ============================================================================
  // LANDING PAGE BLOCKS
  // ============================================================================

  const setLandingBlocks = useCallback((blocks: LandingPageBlock[]) => {
    setState(prev => ({ ...prev, landingBlocks: blocks, isDirty: true }));
  }, []);

  const addLandingBlock = useCallback((block: LandingPageBlock) => {
    setState(prev => ({ ...prev, landingBlocks: [...prev.landingBlocks, block], isDirty: true }));
  }, []);

  const updateLandingBlock = useCallback((id: string, updates: Partial<LandingPageBlock>) => {
    setState(prev => ({
      ...prev,
      landingBlocks: prev.landingBlocks.map(b => b.id === id ? { ...b, ...updates } : b),
      isDirty: true,
    }));
  }, []);

  const removeLandingBlock = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      landingBlocks: prev.landingBlocks.filter(b => b.id !== id),
      isDirty: true,
    }));
  }, []);

  const moveLandingBlock = useCallback((from: number, to: number) => {
    setState(prev => {
      const newBlocks = [...prev.landingBlocks];
      const [moved] = newBlocks.splice(from, 1);
      newBlocks.splice(to, 0, moved);
      return { ...prev, landingBlocks: newBlocks, isDirty: true };
    });
  }, []);

  const duplicateLandingBlock = useCallback((id: string) => {
    setState(prev => {
      const block = prev.landingBlocks.find(b => b.id === id);
      if (!block) return prev;
      const newBlock = {
        ...block,
        id: 'new-' + Math.random().toString(36).substring(2, 9),
        content: { ...block.content },
        settings: { ...block.settings },
      };
      const index = prev.landingBlocks.findIndex(b => b.id === id);
      const newBlocks = [...prev.landingBlocks];
      newBlocks.splice(index + 1, 0, newBlock);
      return { ...prev, landingBlocks: newBlocks, isDirty: true };
    });
  }, []);

  // ============================================================================
  // DISCOUNT POPUP
  // ============================================================================

  const updateDiscountPopup = useCallback((config: Partial<DiscountPopupConfig>) => {
    setState(prev => ({
      ...prev,
      discountPopup: { ...prev.discountPopup, ...config },
      isDirty: true,
    }));
  }, []);

  const toggleDiscountPopup = useCallback(() => {
    setState(prev => ({
      ...prev,
      discountPopup: { ...prev.discountPopup, enabled: !prev.discountPopup.enabled },
      isDirty: true,
    }));
  }, []);

  // ============================================================================
  // CTA & CROSS-SELL
  // ============================================================================

  const setCtaText = useCallback((text: string) => {
    setState(prev => ({ ...prev, ctaText: text, isDirty: true }));
  }, []);

  const setCrossSellProductIds = useCallback((ids: string[]) => {
    setState(prev => ({ ...prev, crossSellProductIds: ids, isDirty: true }));
  }, []);

  const addCrossSellProduct = useCallback((id: string) => {
    setState(prev => {
      if (prev.crossSellProductIds.includes(id)) return prev;
      return { ...prev, crossSellProductIds: [...prev.crossSellProductIds, id], isDirty: true };
    });
  }, []);

  const removeCrossSellProduct = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      crossSellProductIds: prev.crossSellProductIds.filter(i => i !== id),
      isDirty: true,
    }));
  }, []);

  // ============================================================================
  // URGENCY / PROMOTION BAR
  // ============================================================================

  const updatePromotionBar = useCallback((config: Partial<PromotionBarConfig>) => {
    setState(prev => ({
      ...prev,
      promotionBar: { ...prev.promotionBar, ...config },
      isDirty: true,
    }));
  }, []);

  const togglePromotionBar = useCallback(() => {
    setState(prev => ({
      ...prev,
      promotionBar: { ...prev.promotionBar, enabled: !prev.promotionBar.enabled },
      isDirty: true,
    }));
  }, []);

  // ============================================================================
  // SOCIAL PROOF
  // ============================================================================

  const updateSocialProof = useCallback((config: Partial<SocialProofConfig>) => {
    setState(prev => ({
      ...prev,
      socialProof: { ...prev.socialProof, ...config },
      isDirty: true,
    }));
  }, []);

  const toggleSocialProof = useCallback(() => {
    setState(prev => ({
      ...prev,
      socialProof: { ...prev.socialProof, enabled: !prev.socialProof.enabled },
      isDirty: true,
    }));
  }, []);

  // ============================================================================
  // UI
  // ============================================================================

  const setActiveTab = useCallback((tab: string) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const setActiveView = useCallback((view: 'edit' | 'preview') => {
    setState(prev => ({ ...prev, activeView: view }));
  }, []);

  const setPreviewMode = useCallback((mode: 'web' | 'mobile') => {
    setState(prev => ({ ...prev, previewMode: mode }));
  }, []);

  const togglePreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      showPreview: !prev.showPreview,
    }));
  }, []);

  // ============================================================================
  // VERSION HISTORY
  // ============================================================================

  const setShowVersionHistory = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showVersionHistory: show }));
  }, []);

  const loadVersionHistory = useCallback(async (prodId: string) => {
    try {
      const res = await fetch(`/api/v1/products/${prodId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setState(prev => ({ ...prev, versionHistory: data.data || [] }));
      }
    } catch (err) {
      console.error('Failed to load version history:', err);
    }
  }, []);

  // ============================================================================
  // AUTO-SAVE
  // ============================================================================

  const triggerAutoSave = useCallback(async (prodId: string) => {
    if (!state.isDirty) return;

    const currentData = JSON.stringify({
      name: state.name,
      description: state.description,
      price: state.price,
      stock: state.stock,
      discountPercent: state.discountPercent,
    });

    if (currentData === lastSavedDataRef.current) return;

    setState(prev => ({ ...prev, autoSaveStatus: 'saving' }));

    let retries = 0;
    const maxRetries = 3;
    const baseDelay = 1000;

    const attemptSave = async (): Promise<boolean> => {
      try {
        const res = await fetch(`/api/v1/products/${prodId}/draft`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sku: state.sku,
            name: state.name,
            model: state.model,
            description: state.description,
            shortDescription: state.shortDescription,
            brand: state.brand,
            categoryId: state.categoryId,
            status: state.status,
            tags: state.tags,
            height: state.dimensions.height,
            width: state.dimensions.width,
            depth: state.dimensions.depth,
            color: state.color,
            materials: state.materials,
            recommendedAge: state.recommendedAge,
            warrantyDays: state.warrantyDays,
            originCountry: state.originCountry,
            weight: state.weight,
            weightUnit: state.weightUnit,
            stock: state.stock,
            lowStockAlert: state.lowStockAlert,
            price: state.price,
            compareAtPrice: state.compareAtPrice,
            discountPercent: state.discountPercent,
            costPrice: state.costPrice,
            barcode: state.barcode,
            discountPopup: state.discountPopup,
            promotionBar: state.promotionBar,
            socialProof: state.socialProof,
            landingBlocks: state.landingBlocks,
            ctaText: state.ctaText,
            crossSellProductIds: state.crossSellProductIds,
            images: state.productImages,
            mainImageIndex: state.mainImageIndex,
          }),
        });

        if (res.ok) {
          lastSavedDataRef.current = currentData;
          setState(prev => ({
            ...prev,
            autoSaveStatus: 'saved',
            lastSavedAt: new Date(),
            isDirty: false,
          }));

          setTimeout(() => {
            setState(prev => ({ ...prev, autoSaveStatus: 'idle' }));
          }, 3000);
          return true;
        }
        return false;
      } catch (err) {
        return false;
      }
    };

    while (retries < maxRetries) {
      const success = await attemptSave();
      if (success) return;

      retries++;
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, retries - 1)));
      }
    }

    setState(prev => ({ ...prev, autoSaveStatus: 'error' }));
    setTimeout(() => {
      setState(prev => ({ ...prev, autoSaveStatus: 'idle' }));
    }, 5000);
  }, [state]);

  // Auto-save timer effect
  useEffect(() => {
    if (state.isDirty && state.autoSaveStatus !== 'saving') {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        if (productId) {
          triggerAutoSave(productId);
        }
      }, 30000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [state.isDirty, state.autoSaveStatus, productId, triggerAutoSave]);

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const markDirty = useCallback(() => {
    setState(prev => ({ ...prev, isDirty: true }));
  }, []);

  const markClean = useCallback(() => {
    setState(prev => ({ ...prev, isDirty: false }));
  }, []);

  const resetForm = useCallback((data?: Partial<ProductFormState>) => {
    setState(prev => ({
      ...prev,
      ...data,
      isDirty: false,
      autoSaveStatus: 'idle',
      lastSavedAt: null,
    }));
  }, []);

  // ============================================================================
  // PROVIDER VALUE
  // ============================================================================

  const value: ProductFormContextType = {
    ...state,
    productId,
    updateField,
    updateDimensions,
    addMaterial,
    removeMaterial,
    addProductImage,
    removeProductImage,
    setMainImage,
    moveProductImage,
    updateDiscountPopup,
    toggleDiscountPopup,
    setCtaText,
    setCrossSellProductIds,
    addCrossSellProduct,
    removeCrossSellProduct,
    updatePromotionBar,
    togglePromotionBar,
    updateSocialProof,
    toggleSocialProof,
    setLandingBlocks,
    addLandingBlock,
    updateLandingBlock,
    removeLandingBlock,
    moveLandingBlock,
    duplicateLandingBlock,
    setActiveTab,
    setActiveView,
    setPreviewMode,
    togglePreview,
    setShowVersionHistory,
    loadVersionHistory,
    triggerAutoSave,
    markDirty,
    markClean,
    resetForm,
  };

  return (
    <ProductFormContext.Provider value={value}>
      {children}
    </ProductFormContext.Provider>
  );
}
