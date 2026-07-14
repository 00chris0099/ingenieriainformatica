'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, Check, ShoppingCart, Truck, Package, Gift, CreditCard } from 'lucide-react';
import DiscountPopup from '@/components/ui/DiscountPopup';

const UBIGEO: Record<string, Record<string, string[]>> = {
  'Lima': { 'Lima': ['Miraflores', 'San Isidro', 'Jesus Maria', 'Magdalena', 'San Borja', 'Surco', 'San Martin de Porres', 'Comas', 'Los Olivos', 'Rimac', 'Cercado', 'Pueblo Libre', 'Brena', 'La Victoria', 'San Luis', 'El Agustino', 'Ate', 'Santa Anita', 'Chorrillos', 'San Juan de Miraflores', 'Villa Maria del Triunfo', 'Villa El Salvador', 'San Juan de Lurigancho', 'Carabayllo', 'Puente Piedra', 'Ancón', 'Santa Rosa'] },
  'Arequipa': { 'Arequipa': ['Cercado', 'Cayma', 'Cerro Colorado', 'La Joya', 'Paucarpata', 'Socabaya'] },
  'Cusco': { 'Cusco': ['Cercado', 'Wanchaq', 'San Sebastian'] },
  'La Libertad': { 'Trujillo': ['Trujillo', 'Huanchaco', 'La Esperanza'] },
  'Piura': { 'Piura': ['Piura', 'Castilla'] },
  'Lambayeque': { 'Chiclayo': ['Chiclayo', 'Pimentel'] },
  'Ica': { 'Ica': ['Ica'] },
  'Junin': { 'Huancayo': ['Huancayo'] },
};

interface SuggestedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  imageUrl: string | null;
  type: 'existing' | 'custom';
}

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  product?: any;
  selectedOffer?: any;
}

export default function CheckoutModal({ open, onClose, product, selectedOffer }: CheckoutModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'processing' | 'done'>('form');
  const [offer, setOffer] = useState(selectedOffer);
  const [extraItems, setExtraItems] = useState<any[]>([]);
  const [crossSellProducts, setCrossSellProducts] = useState<any[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [selectedSuggested, setSelectedSuggested] = useState<SuggestedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  // Use product's discountPopup config: percent OR fixed amount
  const [extraDiscountPercent, setExtraDiscountPercent] = useState(
    product?.discountPopup?.discountPercent || 10
  );
  const [extraDiscountAmount, setExtraDiscountAmount] = useState<number | null>(
    product?.discountPopup?.discountAmount ?? null
  );
  const [orderNumber, setOrderNumber] = useState('');
  const [mpFailed, setMpFailed] = useState(false);
  const [mpErrorDetail, setMpErrorDetail] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    department: '',
    province: '',
    district: '',
    address: '',
    reference: '',
    paymentMethod: 'contraentrega' as 'contraentrega' | 'mercadopago',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isClosing, setIsClosing] = useState(false);

  // Fetch cross-sell products
  useEffect(() => {
    if (product?.crossSellProductIds?.length > 0) {
      fetch(`/api/v1/products?limit=50`)
        .then(r => r.json())
        .then(data => {
          const items = Array.isArray(data.data) ? data.data : [];
          setCrossSellProducts(items.filter((p: any) => product.crossSellProductIds.includes(p.id)));
        })
        .catch(() => {});
    }
  }, [product]);

  // Fetch suggested products
  useEffect(() => {
    if (product?.id) {
      fetch(`/api/v1/suggested-products?product_id=${product.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.data) {
            setSuggestedProducts(data.data);
          }
        })
        .catch(() => {});
    }
  }, [product]);

  useEffect(() => {
    if (selectedOffer) setOffer(selectedOffer);
  }, [selectedOffer]);

  // User tries to close checkout - show discount popup instead
  const handleAttemptClose = () => {
    if (step === 'done' || step === 'processing') {
      onClose();
      return;
    }
    // Always show popup when closing
    setShowDiscountPopup(true);
  };

  // User accepts discount - apply and keep checkout open
  const handleDiscountPopupClose = () => {
    setShowDiscountPopup(false);
    setDiscountApplied(true);
    // NO onClose() - checkout stays open with discount applied
  };

  // User declines discount - close checkout
  const handleDiscountPopupDecline = () => {
    setShowDiscountPopup(false);
    onClose();
  };

  const toggleSuggested = (product: SuggestedProduct) => {
    const pid = String(product.id);
    setSelectedSuggested(prev => {
      const exists = prev.find(p => String(p.id) === pid);
      if (exists) return prev.filter(p => String(p.id) !== pid);
      return [...prev, product];
    });
  };

  // Price logic: always apply product-level priceConfig discount for the main offer
  const getOfferFinalPrice = (rawPrice: number, isMainOffer: boolean) => {
    const num = Number(rawPrice) || 0;
    if (isMainOffer && product?.priceConfig) {
      const hasEsp = product.priceConfig?.enabledTypes?.includes('especial') && product.priceConfig?.especial != null;
      if (hasEsp) return Number(product.priceConfig.especial);
      const hasDesc = product.priceConfig?.descuento != null && product.priceConfig.descuento > 0;
      if (hasDesc) return Math.round(num * (1 - product.priceConfig.descuento / 100) * 100) / 100;
    }
    return num;
  };

  // Extra popup discount - supports percent OR fixed soles amount
  const applyExtraDiscount = (price: number, isSuggested: boolean = false) => {
    const num = Number(price) || 0;
    if (!discountApplied || isSuggested) return num;
    const hasFixed = extraDiscountAmount != null && extraDiscountAmount > 0;
    if (hasFixed) {
      return Math.max(0, Math.round((num - extraDiscountAmount) * 100) / 100);
    }
    return Math.round(num * (1 - extraDiscountPercent / 100) * 100) / 100;
  };

  if (!open || !product) return null;

  const departments = Object.keys(UBIGEO);
  const provinces = form.department ? Object.keys(UBIGEO[form.department] || {}) : [];
  const districts = form.province ? (UBIGEO[form.department]?.[form.province] || []) : [];

  // Calculate prices - detect if current offer IS the main variant
  const isFirstVariant = offer?.id === product.variants?.[0]?.id;
  const rawOfferPrice = Number(offer?.price) || 0;
  const offerComparePrice = offer?.compareAtPrice ? Number(offer.compareAtPrice) : null;
  const offerHasOwnDiscount = offerComparePrice !== null && offerComparePrice > rawOfferPrice;
  // Only apply priceConfig to the main offer (first variant)
  const offerFinalPrice = applyExtraDiscount(getOfferFinalPrice(rawOfferPrice, isFirstVariant));
  const extraItemsTotal = extraItems.reduce((sum, item) => sum + applyExtraDiscount(getOfferFinalPrice(Number(item.price) || 0, false)), 0);
  const suggestedTotal = selectedSuggested.reduce((sum, p) => sum + applyExtraDiscount(p.price, true), 0);
  const allItems = [
    { ...offer, price: offerFinalPrice, quantity: 1, type: 'main' as const },
    ...extraItems.map(e => ({ ...e, price: applyExtraDiscount(getOfferFinalPrice(Number(e.price) || 0, false)), quantity: 1, type: 'extra' as const })),
  ];

  const subtotal = offerFinalPrice + extraItemsTotal + suggestedTotal;
  const shipping = subtotal >= 150 ? 0 : 10;
  const total = subtotal + shipping;
  const hasProductDiscount = product?.priceConfig?.enabledTypes?.includes('descuento') && product?.priceConfig?.descuento > 0;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nombre requerido';
    if (!form.phone || !/^[0-9]{9}$/.test(form.phone) || !form.phone.startsWith('9')) errs.phone = 'Ingresa un celular valido (9 dígitos, empieza con 9)';
    if (form.email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) errs.email = 'Ingresa un correo valido';
    if (!form.department) errs.department = 'Selecciona departamento';
    if (!form.province) errs.province = 'Selecciona provincia';
    if (!form.district) errs.district = 'Selecciona distrito';
    if (!form.address.trim()) errs.address = 'Direccion requerida';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setMpFailed(false);
    setStep('processing');
    try {
      const orderItems = [
        ...allItems.map(item => ({
          name: item.name || product.name,
          price: Number(item.price) || 0,
          originalPrice: item.type === 'main' ? Number(offer?.price) || 0 : Number(item.price) || 0,
          quantity: 1,
          variantId: item.id,
          offerId: item.id,
        })),
        ...selectedSuggested.map(sp => ({
          name: sp.name,
          price: applyExtraDiscount(sp.price),
          originalPrice: sp.price,
          quantity: 1,
          variantId: sp.id,
          isSuggested: true,
        })),
      ];

      const customerEmail = form.email || `${form.phone}@guest.adriskids.com`;

      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          customer: { name: form.name, phone: form.phone, email: customerEmail },
          shipping: {
            department: form.department,
            province: form.province,
            district: form.district,
            address: form.address,
            reference: form.reference,
          },
          paymentMethod: form.paymentMethod,
          suggestedProducts: selectedSuggested.map(sp => ({
            ...sp,
            price: applyExtraDiscount(sp.price),
          })),
          extraDiscount: discountApplied ? extraDiscountPercent : 0,
          notes: discountApplied ? `Descuento extra de ${extraDiscountPercent}% aplicado` : '',
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // MercadoPago: create preference and redirect to checkout
        if (form.paymentMethod === 'mercadopago') {
          try {
            const mpRes = await fetch('/api/v1/payments/mercadopago', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.data.id, amount: total, currency: 'PEN' }),
            });
            const mpData = await mpRes.json();
            console.log('[Checkout] MercadoPago response:', mpData);

            if (mpRes.ok && mpData.success && mpData.data) {
              const url = mpData.data.sandboxUrl || mpData.data.checkoutUrl;
              console.log('[Checkout] MercadoPago URL:', url);
              if (url && typeof url === 'string' && url.startsWith('http')) {
                window.location.href = url;
                return;
              }
            }
            console.error('[Checkout] MercadoPago no devolvio URL valida:', mpData);
            setMpErrorDetail(mpData.error || 'Respuesta invalida de MercadoPago');
          } catch (mpErr) {
            console.error('[Checkout] Error de red MercadoPago:', mpErr);
            setMpErrorDetail('Error de conexion con MercadoPago');
          }
          setMpFailed(true);
          setOrderNumber(data.data.orderNumber);
          setStep('done');
          return;
        }

        // Contraentrega: show success screen
        setOrderNumber(data.data.orderNumber);
        setStep('done');
      } else {
        setStep('form');
        alert('Error al procesar el pedido. Intenta de nuevo.');
      }
    } catch {
      setStep('form');
      alert('Error de conexion. Intenta de nuevo.');
    }
  };

  const updateForm = (field: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'department') { next.province = ''; next.district = ''; }
      if (field === 'province') { next.district = ''; }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const addExtraItem = (item: any) => {
    if (extraItems.find(e => e.id === item.id)) return;
    setExtraItems(prev => [...prev, item]);
  };

  const removeExtraItem = (id: string) => {
    setExtraItems(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleAttemptClose} />

      {/* Modal */}
      <div className="relative bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="font-bold text-gray-900">Finalizar compra</h2>
          <button onClick={handleAttemptClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        {step === 'done' ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Pedido enviado</h3>
            <p className="text-sm text-gray-500 mb-1">Tu pedido ha sido enviado por WhatsApp.</p>
            <p className="text-sm text-gray-500 mb-4">Te contactaremos pronto para confirmar.</p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : step === 'processing' ? (
          <div className="p-8 text-center">
            <Loader2 size={32} className="animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Procesando tu pedido...</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Product Summary - always shows selected offer */}
            <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
              {(offer?.images?.[0] || product.images?.[0]) ? (
                <img src={offer?.images?.[0] || product.images?.[0]} alt="" className="w-20 h-20 rounded-lg object-cover" />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-lg" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                <p className="text-xs text-green-600 font-medium mt-0.5">{offer?.name || '1 Unidad'}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {(() => {
                    const rawP = Number(offer?.price) || 0;
                    const offerCompare = offer?.compareAtPrice ? Number(offer.compareAtPrice) : null;
                    const offerHasOwnDiscount = offerCompare !== null && offerCompare > rawP;
                    const finalP = getOfferFinalPrice(rawP, isFirstVariant);
                    const hasDiscount = rawP > finalP;
                    const discountPct = hasDiscount ? Math.round((1 - finalP / rawP) * 100) : 0;
                    // Show strikethrough: either variant has compareAtPrice, or priceConfig gives a discount
                    const strikePrice = offerHasOwnDiscount ? offerCompare : rawP;
                    const showStrike = offerHasOwnDiscount || hasDiscount;
                    return (
                      <>
                        {showStrike && <span className="text-sm text-gray-400 line-through">S/ {strikePrice}</span>}
                        <span className="text-lg font-bold text-pink-600">S/ {finalP}</span>
                        {(hasDiscount || offerHasOwnDiscount) && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-bold">-{offerHasOwnDiscount ? Math.round((1 - rawP / offerCompare) * 100) : discountPct}%</span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Offer Selection - radio cards */}
            {product.variants?.filter((v: any) => v.isActive !== false).length > 1 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Selecciona tu oferta:</p>
                <div className="space-y-2">
                  {product.variants.filter((v: any) => v.isActive !== false).map((v: any) => {
                    const isSelected = offer?.id === v.id;
                    const rawP = Number(v.price) || 0;
                    const compareP = v.compareAtPrice ? Number(v.compareAtPrice) : null;
                    const hasOwnDiscount = compareP && compareP > rawP;
                    // For the FIRST variant (main offer), apply priceConfig discount
                    const isFirstVariant = product.variants?.[0]?.id === v.id;
                    const finalP = isFirstVariant ? getOfferFinalPrice(rawP, true) : rawP;
                    const showStrike = isFirstVariant ? (hasOwnDiscount || rawP > finalP) : hasOwnDiscount;
                    const strikePrice = hasOwnDiscount ? compareP : rawP;
                    const pct = showStrike ? Math.round((1 - finalP / strikePrice) * 100) : 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setOffer(v)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        {/* Radio circle */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>

                        {/* Image */}
                        {v.images?.[0] && <img src={v.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                            {(v.attributes as any)?.badge && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-orange-500 text-white rounded-full font-medium">{(v.attributes as any).badge}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {showStrike && <span className="text-xs text-gray-400 line-through">S/ {Number(strikePrice)}</span>}
                            <span className="text-sm font-bold text-pink-600">S/ {finalP}</span>
                            {showStrike && pct > 0 && <span className="text-[9px] px-1 py-0.5 bg-orange-100 text-orange-600 rounded font-medium">-{pct}%</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shipping Form */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-700">Datos de envio</p>

              <div>
                <input type="text" placeholder="Nombre completo" value={form.name} onChange={(e) => updateForm('name', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
              </div>

              <div>
                <input type="tel" placeholder="Celular (9 dígitos)" value={form.phone} onChange={(e) => updateForm('phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                {errors.phone && <p className="text-[10px] text-red-500 mt-0.5">{errors.phone}</p>}
              </div>

              <div>
                <input type="email" placeholder="Correo electrónico (opcional)" value={form.email} onChange={(e) => updateForm('email', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                {errors.email && <p className="text-[10px] text-red-500 mt-0.5">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <select value={form.department} onChange={(e) => updateForm('department', e.target.value)}
                  className={`px-2 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.department ? 'border-red-300' : 'border-gray-200'}`}>
                  <option value="">Depto.</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={form.province} onChange={(e) => updateForm('province', e.target.value)}
                  className={`px-2 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.province ? 'border-red-300' : 'border-gray-200'}`} disabled={!form.department}>
                  <option value="">Provincia</option>
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={form.district} onChange={(e) => updateForm('district', e.target.value)}
                  className={`px-2 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.district ? 'border-red-300' : 'border-gray-200'}`} disabled={!form.province}>
                  <option value="">Distrito</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <input type="text" placeholder="Direccion" value={form.address} onChange={(e) => updateForm('address', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.address ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                {errors.address && <p className="text-[10px] text-red-500 mt-0.5">{errors.address}</p>}
              </div>

              <input type="text" placeholder="Referencia (opcional)" value={form.reference} onChange={(e) => updateForm('reference', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            {/* Cross-sell Products */}
            {crossSellProducts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Tambien te puede interesar</p>
                <div className="space-y-2">
                  {crossSellProducts.map((cp) => {
                    const cpPrice = cp.variants?.[0]?.price || 0;
                    const cpCompare = cp.variants?.[0]?.compareAtPrice;
                    const isAdded = extraItems.find(e => e.id === cp.variants?.[0]?.id);
                    return (
                      <button
                        key={cp.id}
                        onClick={() => isAdded ? removeExtraItem(cp.variants?.[0]?.id) : addExtraItem({ id: cp.variants?.[0]?.id, name: cp.name, price: cpPrice, images: cp.images })}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all ${isAdded ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        {cp.images?.[0] && <img src={cp.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{cp.name}</p>
                          <div className="flex items-center gap-1.5">
                            {cpCompare && cpCompare > cpPrice && <span className="text-[10px] text-gray-400 line-through">S/ {cpCompare}</span>}
                            <span className="text-xs font-bold text-green-600">S/ {cpPrice}</span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isAdded ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                          {isAdded && <Check size={12} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suggested Products */}
            {suggestedProducts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">¿Te interesa también?</p>
                <p className="text-[10px] text-gray-400 mb-2">Selecciona productos adicionales para tu pedido</p>
                <div className="space-y-2">
                  {suggestedProducts.map((sp) => {
                    const isSelected = selectedSuggested.some(p => String(p.id) === String(sp.id));
                    return (
                      <button
                        key={sp.id}
                        onClick={() => toggleSuggested(sp)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        {sp.imageUrl ? (
                          <img src={sp.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{sp.name}</p>
                          {sp.description && (
                            <p className="text-[10px] text-gray-500 truncate">{sp.description}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {(() => {
                              // Suggested products use their OWN price independently
                              const rawP = sp.price;
                              const compareP = sp.compareAtPrice ? Number(sp.compareAtPrice) : null;
                              const hasOwnDiscount = compareP && compareP > rawP;
                              const finalP = applyExtraDiscount(rawP, true);
                              const pct = sp.discountPercent > 0 ? sp.discountPercent : (hasOwnDiscount ? Math.round((1 - rawP / compareP) * 100) : 0);
                              return (
                                <>
                                  {hasOwnDiscount && <span className="text-[10px] text-gray-400 line-through">S/ {compareP}</span>}
                                  <span className="text-xs font-bold text-pink-600">S/ {finalP}</span>
                                  {pct > 0 && (
                                    <span className="text-[9px] px-1 py-0.5 bg-orange-100 text-orange-600 rounded font-medium">-{pct}%</span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              {/* Show main offer original price strikethrough */}
              {(() => {
                const rawP = Number(offer?.price) || 0;
                const offerCompare = offer?.compareAtPrice ? Number(offer.compareAtPrice) : null;
                const offerHasOwnDiscount = offerCompare !== null && offerCompare > rawP;
                const finalP = getOfferFinalPrice(rawP, isFirstVariant);
                const hasProdDiscount = rawP > finalP;
                const strikePrice = offerHasOwnDiscount ? offerCompare : rawP;
                const showStrike = offerHasOwnDiscount || hasProdDiscount;
                return (
                  <>
                    {showStrike && (
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{product.name}</span>
                        <span className="line-through">S/ {Number(strikePrice).toFixed(2)}</span>
                      </div>
                    )}
                  </>
                );
              })()}
              {/* Show additional offers with their OWN compareAtPrice */}
              {extraItems.map((item, i) => {
                const rawP = Number(item.price) || 0;
                const compareP = item.compareAtPrice ? Number(item.compareAtPrice) : null;
                const hasOwnDiscount = compareP && compareP > rawP;
                return (
                  <div key={`extra-${i}`}>
                    {hasOwnDiscount && (
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{item.name}</span>
                        <span className="line-through">S/ {Number(compareP).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{item.name}</span>
                      <span className="font-medium text-pink-600">S/ {Number(applyExtraDiscount(rawP)).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
              {/* Main offer final price */}
              <div className="flex justify-between text-xs text-gray-600">
                <span>{product.name}</span>
                <span className="font-medium text-pink-600">S/ {offerFinalPrice.toFixed(2)}</span>
              </div>
              {selectedSuggested.length > 0 && (
                <>
                  {selectedSuggested.map((sp, i) => {
                    const rawP = Number(sp.price) || 0;
                    const compareP = sp.compareAtPrice ? Number(sp.compareAtPrice) : null;
                    const hasOwnDiscount = compareP && compareP > rawP;
                    return (
                      <div key={`sp-${i}`}>
                        {hasOwnDiscount && (
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>+ {sp.name}</span>
                            <span className="line-through">S/ {Number(compareP).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs text-blue-600">
                          <span>+ {sp.name}</span>
                          <span>S/ {Number(applyExtraDiscount(rawP, true)).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              {discountApplied && (
                <div className="flex justify-between text-xs text-green-600 font-medium">
                  <span className="flex items-center gap-1"><Gift size={12} /> Descuento extra -{extraDiscountPercent}%</span>
                  <span></span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-600">
                <span className="flex items-center gap-1"><Truck size={12} /> Envio (aproximadamente)</span>
                <span>{shipping === 0 ? <span className="text-green-600 font-medium">Gratis</span> : `S/ ${shipping.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between text-sm font-bold text-gray-900">
                <span>Total</span>
                <span className="text-green-600">S/ {total.toFixed(2)}</span>
              </div>
              {discountApplied && (
                <p className="text-[10px] text-green-600 text-center mt-1">Descuento extra de {extraDiscountPercent}% aplicado a todos los productos</p>
              )}
            </div>

            {/* Payment Info */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-800 font-medium flex items-center gap-1"><Truck size={12} /> Pago contraentrega</p>
              <p className="text-[10px] text-amber-700 mt-0.5">Tu pedido sera confirmado y coordinado para entrega.</p>
            </div>

            {/* Submit - Redirige a WhatsApp */}
            <button
              onClick={() => {
                if (!validate()) return;
                const allItemsText = [
                  `- ${product.name} (${offer?.name || '1 Unidad'}) x1 = S/ ${offerFinalPrice.toFixed(2)}`,
                  ...extraItems.map(e => `- ${e.name} x1 = S/ ${Number(e.price).toFixed(2)}`),
                  ...selectedSuggested.map(sp => `- ${sp.name} x1 = S/ ${Number(sp.price).toFixed(2)}`),
                ].join('%0A');
                const msg = `🛒 *Nuevo Pedido - AdriSu Kids*%0A%0A👤 *Cliente:* ${encodeURIComponent(form.name)}%0A📱 *Celular:* ${form.phone}%0A📧 *Email:* ${encodeURIComponent(form.email || 'No proporcionado')}%0A%0A📦 *Productos:*%0A${allItemsText}%0A%0A💰 *Resumen:*%0A- Subtotal: S/ ${subtotal.toFixed(2)}%0A- Envio (aproximadamente): S/ ${shipping.toFixed(2)}%0A${discountApplied ? `- Descuento extra (-${extraDiscountPercent}%): aplicado%0A` : ''}- *TOTAL: S/ ${total.toFixed(2)}*%0A%0A📍 *Direccion de envio:*%0A${encodeURIComponent(form.department)} - ${encodeURIComponent(form.province)} - ${encodeURIComponent(form.district)}%0A${encodeURIComponent(form.address)}%0ARef: ${encodeURIComponent(form.reference || 'Sin referencia')}`;
                window.open(`https://wa.me/51951308866?text=${msg}`, '_blank');
                setStep('done');
                setOrderNumber('PENDIENTE');
              }}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              Realizar pedido
            </button>
          </div>
        )}
      </div>

      {/* Discount Popup - Uses product's discountPopup config from WMS */}
      {showDiscountPopup && (
        <DiscountPopup
          config={{
            enabled: true,
            title: product?.discountPopup?.title || '¡Descuento exclusivo!',
            description: product?.discountPopup?.description || `Obtén un ${extraDiscountPercent}% extra de descuento en tu compra. ¡Aprovecha esta oferta!`,
            discountPercent: product?.discountPopup?.discountPercent || extraDiscountPercent,
            ctaText: product?.discountPopup?.ctaText || '¡Aplicar descuento!',
            ctaUrl: product?.discountPopup?.ctaUrl || '#',
            imageUrl: product?.discountPopup?.imageUrl || product?.images?.[0] || '',
            bgColor: product?.discountPopup?.bgColor || '#ec4899',
            textColor: product?.discountPopup?.textColor || '#ffffff',
          }}
          productPrice={getOfferFinalPrice(Number(offer?.price) || 0, isFirstVariant)}
          productName={product?.name || ''}
          productImage={product?.discountPopup?.imageUrl || product?.images?.[0]}
          onAccept={handleDiscountPopupClose}
          onDecline={handleDiscountPopupDecline}
        />
      )}
    </div>
  );
}
