'use client';

import { useCartStore } from '@/store/cartStore';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, ShoppingCart, Package, Truck, CreditCard, MapPin, Phone, ShieldCheck, MessageCircle, Minus, Plus, Check } from 'lucide-react';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { isValidPeruPhone, isValidEmail } from '@/lib/ubigeo';

const UBIGEO: Record<string, Record<string, string[]>> = {
  'Lima': { 'Lima': ['Miraflores', 'San Isidro', 'Jesus Maria', 'Magdalena', 'San Borja', 'Surco', 'San Martin de Porres', 'Comas', 'Los Olivos', 'Rimac', 'Cercado', 'Pueblo Libre', 'Brena', 'La Victoria', 'San Luis', 'El Agustino', 'Ate', 'Santa Anita', 'Chorrillos', 'San Juan de Miraflores', 'Villa Maria del Triunfo', 'Villa El Salvador', 'San Juan de Lurigancho', 'Carabayllo', 'Puente Piedra', 'Ancón', 'Santa Rosa'], 'Cañete': ['San Vicente de Cañete', 'Mala', 'Chincha Alta', 'Pisco'] },
  'Arequipa': { 'Arequipa': ['Cercado', 'Cayma', 'Cerro Colorado', 'Characato', 'Chiguata', 'Jacobo Hunter', 'La Joya', 'Mariano Melgar', 'Miraflores', 'Mollebaya', 'Paucarpata', 'Pocsi', 'Polobaya', 'Quequeña', 'Sabandia', 'Sachaca', 'San Juan de Siguas', 'San Juan de Tarucani', 'Santa Isabel de Siguas', 'Santa Rita de Siguas', 'Socabaya', 'Tiabaya', 'Uchumayo', 'Vítor', 'Yanahuara', 'Yarabamba', 'Yura'] },
  'Cusco': { 'Cusco': ['Cercado', 'Wanchaq', 'San Sebastian', 'San Jeronimo', 'Santiago', 'Saylla', 'Huanca'] },
  'La Libertad': { 'Trujillo': ['Trujillo', 'Huanchaco', 'Lanchipampa', 'La Esperanza', 'Flores', 'Salaverry', 'Víctor Larco Herrera'] },
  'Piura': { 'Piura': ['Piura', 'Castilla', 'Catacaos', 'La Arena', 'La Union', 'Las Lomas', 'Tambo Grande'] },
  'Lambayeque': { 'Chiclayo': ['Chiclayo', 'Pimentel', 'Reque'] },
  'Ica': { 'Ica': ['Ica', 'La Tinguiña', 'Los Aquijes', 'Ocucaje'] },
  'Junin': { 'Huancayo': ['Huancayo', 'Chilca', 'Chongos Alto', 'El Tambo'] },
};

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ open, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const { items, total, clearCart, updateQuantity, removeItem } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'form' | 'payment' | 'done'>('form');
  const [offers, setOffers] = useState<any[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    department: '', province: '', district: '', address: '', reference: '',
    paymentMethod: 'contraentrega' as 'mercadopago' | 'contraentrega',
  });

  useEffect(() => {
    if (open) {
      fetch('/api/v1/offers').then(r => r.json()).then(d => setOffers(d.data || [])).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nombre requerido';
    if (!form.email.trim() || !isValidEmail(form.email)) e.email = 'Email invalido';
    if (!form.phone.trim() || !isValidPeruPhone(form.phone)) e.phone = 'Celular invalido (9xx)';
    if (!form.department) e.department = 'Requerido';
    if (!form.province) e.province = 'Requerido';
    if (!form.district) e.district = 'Requerido';
    if (!form.address.trim()) e.address = 'Direccion requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (items.length === 0 || !validate()) return;
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
      setStep('done');
    } catch { alert('Error al procesar. Intenta de nuevo.'); }
    setLoading(false);
  };

  if (!open) return null;

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

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal - full on mobile, centered on desktop */}
      <div className="relative bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[92vh] md:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20} className="text-green-600" /> Checkout</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {step === 'done' ? (
            /* Success State */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={32} className="text-green-600" /></div>
              <h3 className="text-xl font-bold mb-2">Pedido confirmado!</h3>
              <p className="text-gray-500 text-sm mb-4">Recibiras un email de confirmacion.</p>
              {form.paymentMethod === 'contraentrega' && (
                <a href={`https://wa.me/51999111222?text=Hola, quiero confirmar mi pedido de AdriSu Kids`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                  <MessageCircle size={18} /> Contactar por WhatsApp
                </a>
              )}
              <button onClick={onClose} className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700">Cerrar</button>
            </div>
          ) : step === 'form' ? (
            <>
              {/* Products */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">Tu pedido</h3>
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3 items-center mb-3 last:mb-0">
                    <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-500">S/ {item.price}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center"><Minus size={10} /></button>
                      <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center"><Plus size={10} /></button>
                    </div>
                    <span className="text-xs font-semibold ml-1">S/ {item.price * item.quantity}</span>
                    <button onClick={() => removeItem(item.variantId)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
              </div>

              {/* Offers */}
              {offers.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-2">Ofertas disponibles</h3>
                  {offers.map((offer: any) => (
                    <label key={offer.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${selectedOffers.includes(offer.id) ? 'border-green-500 bg-white' : 'border-green-200 hover:border-green-300'}`}>
                      <input type="checkbox" checked={selectedOffers.includes(offer.id)}
                        onChange={(e) => setSelectedOffers(e.target.checked ? [...selectedOffers, offer.id] : selectedOffers.filter((id) => id !== offer.id))}
                        className="w-4 h-4 text-green-600 rounded" />
                      <div className="flex-1"><p className="text-xs font-medium">{offer.name}</p><p className="text-[10px] text-gray-500">{offer.description || `Min ${offer.minQuantity} uds`}</p></div>
                      <span className="text-xs font-bold text-green-600">-{offer.discountPercent}%</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Form */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><MapPin size={16} className="text-green-600" /> Datos de envio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Nombre *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`w-full px-3 py-2.5 border rounded-xl text-sm ${errors.name ? 'border-red-300' : 'border-gray-200'}`} placeholder="Juan Perez" />
                    {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Celular *</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`w-full px-3 py-2.5 border rounded-xl text-sm ${errors.phone ? 'border-red-300' : 'border-gray-200'}`} placeholder="999123456" maxLength={9} />
                    {errors.phone && <p className="text-[10px] text-red-500 mt-0.5">{errors.phone}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Email *</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" className={`w-full px-3 py-2.5 border rounded-xl text-sm ${errors.email ? 'border-red-300' : 'border-gray-200'}`} placeholder="tu@email.com" />
                  {errors.email && <p className="text-[10px] text-red-500 mt-0.5">{errors.email}</p>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Depto *</label>
                    <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value, province: '', district: '' })} className={`w-full px-2 py-2.5 border rounded-xl text-xs ${errors.department ? 'border-red-300' : 'border-gray-200'}`}>
                      <option value="">...</option>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Provincia *</label>
                    <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value, district: '' })} disabled={!form.department} className={`w-full px-2 py-2.5 border rounded-xl text-xs ${errors.province ? 'border-red-300' : 'border-gray-200'}`}>
                      <option value="">...</option>
                      {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Distrito *</label>
                    <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} disabled={!form.province} className={`w-full px-2 py-2.5 border rounded-xl text-xs ${errors.district ? 'border-red-300' : 'border-gray-200'}`}>
                      <option value="">...</option>
                      {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Direccion *</label>
                  <AddressAutocomplete value={form.address} onChange={(v) => setForm({ ...form, address: v })} department={form.department} province={form.province} district={form.district} placeholder="Av. Ejemplo 123" error={errors.address} />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Referencia</label>
                  <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="Frente al parque" />
                </div>
              </div>

              <button onClick={() => { if (validate()) setStep('payment'); }}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                Siguiente
              </button>
            </>
          ) : (
            /* Payment Step */
            <>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>S/ {subtotal}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Envio</span><span>{shipping === 0 ? 'Gratis' : `S/ ${shipping}`}</span></div>
                {offerDiscount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Descuento</span><span>-S/ {offerDiscount.toFixed(2)}</span></div>}
                <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span className="text-green-600">S/ {finalTotal.toFixed(2)}</span></div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><CreditCard size={16} className="text-green-600" /> Metodo de pago</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setForm({ ...form, paymentMethod: 'contraentrega' })} className={`p-4 border-2 rounded-xl text-center transition-all ${form.paymentMethod === 'contraentrega' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <Truck size={20} className="mx-auto text-green-600 mb-1" />
                    <p className="text-xs font-medium">Contraentrega</p>
                    <p className="text-[10px] text-gray-400">Paga al recibir</p>
                  </button>
                  <button onClick={() => setForm({ ...form, paymentMethod: 'mercadopago' })} className={`p-4 border-2 rounded-xl text-center transition-all ${form.paymentMethod === 'mercadopago' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <CreditCard size={20} className="mx-auto text-blue-600 mb-1" />
                    <p className="text-xs font-medium">Pago seguro</p>
                    <p className="text-[10px] text-gray-400">Tarjeta / Yape / Plin</p>
                  </button>
                </div>

                {form.paymentMethod === 'contraentrega' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-800 font-medium flex items-center gap-1.5"><Phone size={12} /> Contraentrega</p>
                    <p className="text-[10px] text-amber-700 mt-1">Tu pedido sera coordinado para entrega.</p>
                    <a href={`https://wa.me/51999111222?text=Hola, quiero confirmar mi pedido de AdriSu Kids`} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-green-700">
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('form')} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Volver</button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Procesando...</> : `Pagar S/ ${finalTotal.toFixed(2)}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
