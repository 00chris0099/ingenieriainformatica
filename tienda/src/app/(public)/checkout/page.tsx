'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, ShoppingCart, Package, Truck, CreditCard, MapPin, Phone, ShieldCheck, MessageCircle, ChevronDown, Plus, Minus, X } from 'lucide-react';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import DiscountPopup from '@/components/ui/DiscountPopup';
import { isValidPeruPhone, isValidEmail } from '@/lib/ubigeo';

/**
 * RF-27: Save abandoned checkout when user leaves page
 */
function useAbandonedCheckout(form: any, items: any[], total: number) {
  const savedRef = useRef(false);

  useEffect(() => {
    const saveAbandoned = async () => {
      if (savedRef.current || items.length === 0) return;
      savedRef.current = true;

      try {
        await fetch('/api/v1/abandoned-checkouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionStorage.getItem('sessionId') || Date.now().toString(),
            email: form.email,
            phone: form.phone,
            name: form.name,
            items: items.map(i => ({
              variantId: i.variantId,
              sku: i.sku,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
            })),
            subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
            total,
            shippingAddress: {
              department: form.department,
              province: form.province,
              district: form.district,
              address: form.address,
              reference: form.reference,
            },
            paymentMethod: form.paymentMethod,
          }),
        });
      } catch (err) {
        console.error('Failed to save abandoned checkout:', err);
      }
    };

    const handleBeforeUnload = () => {
      if (items.length > 0 && !savedRef.current) {
        navigator.sendBeacon('/api/v1/abandoned-checkouts', new Blob([
          JSON.stringify({
            sessionId: sessionStorage.getItem('sessionId') || Date.now().toString(),
            email: form.email,
            phone: form.phone,
            name: form.name,
            items: items.map(i => ({
              variantId: i.variantId,
              sku: i.sku,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
            })),
            subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
            total,
            shippingAddress: {
              department: form.department,
              province: form.province,
              district: form.district,
              address: form.address,
              reference: form.reference,
            },
            paymentMethod: form.paymentMethod,
          })
        ], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [form, items, total]);
}

// Ubigeo simplificado - departamentos principales de Peru
const UBIGEO: Record<string, Record<string, string[]>> = {
  'Lima': { 'Lima': ['Miraflores', 'San Isidro', 'Jesus Maria', 'Magdalena', 'San Borja', 'Surco', 'San Martin de Porres', 'Comas', 'Los Olivos', 'Rimac', 'Cercado', 'Pueblo Libre', 'Brena', 'La Victoria', 'San Luis', 'El Agustino', 'Ate', 'Santa Anita', 'Chorrillos', 'San Juan de Miraflores', 'Villa Maria del Triunfo', 'Villa El Salvador', 'San Juan de Lurigancho', 'Carabayllo', 'Puente Piedra', 'Ancón', 'Santa Rosa'], 'Cañete': ['San Vicente de Cañete', 'Mala', 'Chincha Alta', 'Pisco'] },
  'Arequipa': { 'Arequipa': ['Cercado', 'Cayma', 'Cerro Colorado', 'Characato', 'Chiguata', 'Jacobo Hunter', 'La Joya', 'Mariano Melgar', 'Miraflores', 'Mollebaya', 'Paucarpata', 'Pocsi', 'Polobaya', 'Quequeña', 'Sabandia', 'Sachaca', 'San Juan de Siguas', 'San Juan de Tarucani', 'Santa Isabel de Siguas', 'Santa Rita de Siguas', 'Socabaya', 'Tiabaya', 'Uchumayo', 'Vítor', 'Yanahuara', 'Yarabamba', 'Yura'] },
  'Cusco': { 'Cusco': ['Cercado', 'Wanchaq', 'San Sebastian', 'San Jeronimo', 'Santiago', 'Saylla', 'Huancaro'] },
  'La Libertad': { 'Trujillo': ['Trujillo', 'Huanchaco', 'Lanchipampa', 'La Esperanza', 'Flores', 'Salaverry', 'Víctor Larco Herrera'], 'Chiclayo': ['Chiclayo', 'Pimentel', 'Reque', 'SANTA ROSA', 'Saña', 'Cañaveral'] },
  'Piura': { 'Piura': ['Piura', 'Castilla', 'Catacaos', 'La Arena', 'La Union', 'Las Lomas', 'Tambo Grande'] },
  'Lambayeque': { 'Chiclayo': ['Chiclayo', 'Pimentel', 'Reque'], 'Ferñafe': ['Ferñafe', 'Cañaris', 'Incahuasi'] },
  'Ica': { 'Ica': ['Ica', 'La Tinguiña', 'Los Aquijes', 'Ocucaje', 'Pachacutec', 'Parcona', 'Pueblo Nuevo', 'Salas', 'San Jose de Los Molinos', 'San Juan Bautista', 'Santiago', 'Subtanjalla', 'Tate', 'Yauca del Rosario'] },
  'Junin': { 'Huancayo': ['Huancayo', 'Chilca', 'Chongos Alto', 'Chupuro', 'Colca', 'Comas', 'El Tambo', 'Huancancpco', 'Huancayo', 'Huacrapuquio', 'Hualhuas', 'Huancan', 'Huasicancha', 'Huayucachi', 'Ingenio', 'Pariahuanca', 'Pilcomayo', 'Pucara', 'Quichuas', 'Quilcas', 'San Agustin', 'San Jeronimo de Tunan', 'San Pedro de Saño', 'Santoyo', 'Sapallanga', 'Viques', 'Yacus', 'Yanacancha'] },
};

interface FormErrors { [key: string]: string; }

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart, updateQuantity, removeItem } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [offers, setOffers] = useState<any[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    department: '', province: '', district: '', address: '', reference: '',
    paymentMethod: 'contraentrega' as 'mercadopago' | 'contraentrega',
  });

  // Discount popup state
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);
  const [discountConfig, setDiscountConfig] = useState<any>(null);

  // Load discount popup config from first item in cart
  useEffect(() => {
    if (items.length > 0) {
      const firstItem = items[0];
      // In real app, fetch product discount config from API
      // For now, use a default config
      setDiscountConfig({
        enabled: true,
        title: 'Oferta especial!',
        description: 'Obtén un descuento exclusivo en este producto',
        discountPercent: 10,
        ctaText: 'Comprar ahora',
        ctaUrl: '/tienda',
        imageUrl: firstItem.image || '',
        bgColor: '#16a34a',
        textColor: '#ffffff',
      });
    }
  }, [items]);

  // Show popup when user leaves checkout (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const storageKey = 'discount-popup-seen-checkout';
      if (!sessionStorage.getItem(storageKey) && items.length > 0) {
        sessionStorage.setItem(storageKey, 'true');
        setShowDiscountPopup(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [items]);

  // RF-27: Track abandoned checkout
  useAbandonedCheckout(form, items, total());

  useEffect(() => {
    fetch('/api/v1/offers').then(r => r.json()).then(d => setOffers(d.data || [])).catch(() => {});
  }, []);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Nombre requerido';
    if (!form.email.trim() || !isValidEmail(form.email)) e.email = 'Email invalido';
    if (!form.phone.trim() || !isValidPeruPhone(form.phone)) e.phone = 'Celular invalido (9 digitos, empieza con 9)';
    if (!form.department) e.department = 'Departamento requerido';
    if (!form.province) e.province = 'Provincia requerida';
    if (!form.district) e.district = 'Distrito requerido';
    if (!form.address.trim()) e.address = 'Direccion requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (items.length === 0) { alert('Tu carrito esta vacio'); return; }
    if (!validate()) return;
    setLoading(true);
    try {
      const offerDiscount = selectedOffers.reduce((sum, oid) => {
        const o = offers.find((of: any) => of.id === oid);
        return sum + (o ? (total() * o.discountPercent / 100) : 0);
      }, 0);
      const finalTotal = total() + (total() >= 150 ? 0 : 10) - offerDiscount;

      const orderRes = await fetch('/api/v1/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, variantId: i.variantId, sku: i.variantId })),
          customer: { name: form.name, email: form.email, phone: form.phone },
          shipping: { department: form.department, province: form.province, district: form.district, address: form.address, reference: form.reference },
          paymentMethod: form.paymentMethod,
        }),
      });
      if (!orderRes.ok) throw new Error('Error');
      const orderData = await orderRes.json();
      const orderNumber = orderData.data.orderNumber;

      if (form.paymentMethod === 'mercadopago') {
        const mpRes = await fetch('/api/v1/payments/mercadopago', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: orderData.data.id, amount: finalTotal, currency: 'PEN' }),
        });
        if (mpRes.ok) {
          const mpData = await mpRes.json();
          clearCart();
          const url = mpData.data?.sandboxUrl || mpData.data?.checkoutUrl;
          if (url) { window.location.href = url; return; }
        }
      }

      clearCart();
      router.push(`/pedido?n=${orderNumber}`);
    } catch { alert('Error al procesar. Intenta de nuevo.'); }
    setLoading(false);
  };

  const subtotal = total();
  const shipping = subtotal >= 150 ? 0 : 10;
  const offerDiscount = selectedOffers.reduce((sum, oid) => {
    const o = offers.find((of: any) => of.id === oid);
    return sum + (o ? (subtotal * o.discountPercent / 100) : 0);
  }, 0);
  const finalTotal = subtotal + shipping - offerDiscount;
  const departments = Object.keys(UBIGEO);
  const provinces = form.department ? Object.keys(UBIGEO[form.department] || {}) : [];
  const districts = (form.department && form.province) ? (UBIGEO[form.department]?.[form.province] || []) : [];

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b border-gray-100"><div className="max-w-7xl mx-auto px-4 h-14 flex items-center"><Link href="/"><img src="/images/logo.png" alt="AdriSu Kids" className="h-9 w-auto" /></Link></div></header>
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <ShoppingCart size={48} className="text-gray-300 mb-4" />
          <h1 className="text-xl font-bold mb-2">Tu carrito esta vacio</h1>
          <p className="text-gray-500 mb-6">Agrega productos para continuar</p>
          <Link href="/tienda" className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700">Ir a la tienda</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100"><div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/"><img src="/images/logo.png" alt="AdriSu Kids" className="h-9 w-auto" /></Link>
        <span className="text-sm text-gray-500">{items.length} productos en tu pedido</span>
      </div></header>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main Form - 3 cols */}
          <div className="lg:col-span-3 space-y-5">

            {/* Section 1: Product Summary */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h2 className="font-semibold flex items-center gap-2 mb-4"><Package size={18} className="text-green-600" /> Tu pedido</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3 items-center">
                    <img src={item.image} alt="" className="w-14 h-14 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">S/ {item.price} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center"><Minus size={12} /></button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center"><Plus size={12} /></button>
                    </div>
                    <span className="text-sm font-semibold ml-2">S/ {item.price * item.quantity}</span>
                    <button onClick={() => removeItem(item.variantId)} className="text-gray-400 hover:text-red-500 ml-1"><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Configurable Offers */}
            {offers.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h2 className="font-semibold flex items-center gap-2 mb-3"><ShieldCheck size={18} className="text-green-600" /> Ofertas disponibles</h2>
                <div className="space-y-2">
                  {offers.map((offer: any) => (
                    <label key={offer.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedOffers.includes(offer.id) ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={selectedOffers.includes(offer.id)}
                        onChange={(e) => setSelectedOffers(e.target.checked ? [...selectedOffers, offer.id] : selectedOffers.filter((id) => id !== offer.id))}
                        className="w-4 h-4 text-green-600 rounded" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{offer.name}</p>
                        <p className="text-xs text-gray-500">{offer.description || `Min ${offer.minQuantity} unidades`}</p>
                      </div>
                      <span className="text-sm font-bold text-green-600">-{offer.discountPercent}%</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Contact & Shipping Form */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><MapPin size={18} className="text-green-600" /> Datos de envio</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nombre completo *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`w-full px-3 py-2.5 border rounded-xl text-sm ${errors.name ? 'border-red-300' : 'border-gray-200'}`} placeholder="Juan Perez" />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Celular *</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`w-full px-3 py-2.5 border rounded-xl text-sm ${errors.phone ? 'border-red-300' : 'border-gray-200'}`} placeholder="999123456" maxLength={9} />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Email *</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" className={`w-full px-3 py-2.5 border rounded-xl text-sm ${errors.email ? 'border-red-300' : 'border-gray-200'}`} placeholder="tu@email.com" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Departamento *</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value, province: '', district: '' })} className={`w-full px-3 py-2.5 border rounded-xl text-sm ${errors.department ? 'border-red-300' : 'border-gray-200'}`}>
                    <option value="">Seleccionar...</option>
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Provincia *</label>
                  <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value, district: '' })} disabled={!form.department} className={`w-full px-3 py-2.5 border rounded-xl text-sm ${errors.province ? 'border-red-300' : 'border-gray-200'}`}>
                    <option value="">Seleccionar...</option>
                    {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.province && <p className="text-xs text-red-500 mt-1">{errors.province}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Distrito *</label>
                  <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} disabled={!form.province} className={`w-full px-3 py-2.5 border rounded-xl text-sm ${errors.district ? 'border-red-300' : 'border-gray-200'}`}>
                    <option value="">Seleccionar...</option>
                    {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.district && <p className="text-xs text-red-500 mt-1">{errors.district}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Direccion *</label>
                <AddressAutocomplete value={form.address} onChange={(v) => setForm({ ...form, address: v })} department={form.department} province={form.province} district={form.district} placeholder="Av. Ejemplo 123" error={errors.address} />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Referencia (opcional)</label>
                <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="Frente al parque" />
              </div>
            </div>

            {/* Section 4: Info */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h2 className="font-semibold flex items-center gap-2 mb-3"><Package size={18} className="text-green-600" /> Informacion</h2>
              <p className="text-sm text-gray-500">Completa los datos de envio para continuar con tu pedido.</p>
            </div>

            {/* Section 5: Payment Method */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h2 className="font-semibold flex items-center gap-2 mb-3"><CreditCard size={18} className="text-green-600" /> Metodo de pago</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setForm({ ...form, paymentMethod: 'contraentrega' })} className={`p-4 border-2 rounded-xl text-center transition-all ${form.paymentMethod === 'contraentrega' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <Truck size={24} className="mx-auto text-green-600 mb-1" />
                  <p className="text-sm font-medium">Pago contraentrega</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Paga al recibir</p>
                </button>
                <button onClick={() => setForm({ ...form, paymentMethod: 'mercadopago' })} className={`p-4 border-2 rounded-xl text-center transition-all ${form.paymentMethod === 'mercadopago' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <CreditCard size={24} className="mx-auto text-blue-600 mb-1" />
                  <p className="text-sm font-medium">Pago seguro</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Tarjeta / Yape / Plin</p>
                </button>
              </div>

              {form.paymentMethod === 'contraentrega' && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800 font-medium flex items-center gap-2"><Phone size={14} /> Pago contraentrega</p>
                  <p className="text-xs text-amber-700 mt-1">Tu pedido sera confirmado y coordinado para entrega. Contactanos para mas detalles.</p>
                  <a href={`https://wa.me/51999111222?text=Hola, quiero confirmar mi pedido de AdriSu Kids`} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
                    <MessageCircle size={14} /> Contactar por WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Section 6: Confirm Button */}
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
              {loading ? <><Loader2 size={20} className="animate-spin" /> Procesando...</> : `Confirmar pedido - S/ ${finalTotal}`}
            </button>
          </div>

          {/* Sidebar - 2 cols */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 sticky top-20 space-y-4">
              <h3 className="font-semibold">Resumen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>S/ {subtotal}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Envio</span><span>{shipping === 0 ? 'Gratis' : `S/ ${shipping}`}</span></div>
                {offerDiscount > 0 && <div className="flex justify-between text-green-600"><span>Descuento ofertas</span><span>-S/ {offerDiscount.toFixed(2)}</span></div>}
                <div className="border-t pt-2 flex justify-between font-bold text-lg"><span>Total</span><span className="text-green-600">S/ {finalTotal.toFixed(2)}</span></div>
              </div>
              {subtotal < 150 && <p className="text-xs text-gray-400 text-center">Envio gratis en compras mayores a S/ 150</p>}
            </div>
          </div>
        </div>
      </main>

      {/* Discount Popup */}
      {discountConfig && (
        <DiscountPopup
          config={discountConfig}
          productPrice={items[0]?.price || 0}
          productName={items[0]?.name || ''}
          productImage={items[0]?.image}
          onClose={() => setShowDiscountPopup(false)}
        />
      )}
    </div>
  );
}
