'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, Trash2, ShoppingCart } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface Customer {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface Product {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    sku: string;
    name: string;
    price: number;
    inventory?: Array<{ availableQuantity: number }>;
  }>;
}

interface OrderItem {
  variantId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export default function NuevoPedidoPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, prodRes] = await Promise.all([
          fetch('/api/v1/customers?limit=100'),
          fetch('/api/v1/products?limit=100'),
        ]);
        if (custRes.ok) {
          const data = await custRes.json();
          setCustomers(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
        }
        if (prodRes.ok) {
          const data = await prodRes.json();
          setProducts(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const addItem = (variant: Product['variants'][0], product: Product) => {
    const existing = items.find(i => i.variantId === variant.id);
    if (existing) {
      setItems(items.map(i =>
        i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setItems([...items, {
        variantId: variant.id,
        sku: variant.sku,
        name: `${product.name} - ${variant.name}`,
        price: Number(variant.price),
        quantity: 1,
      }]);
    }
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(items.filter(i => i.variantId !== variantId));
    } else {
      setItems(items.map(i =>
        i.variantId === variantId ? { ...i, quantity } : i
      ));
    }
  };

  const removeItem = (variantId: string) => {
    setItems(items.filter(i => i.variantId !== variantId));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const handleSubmit = async () => {
    if (!selectedCustomer || items.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer,
          items: items.map(i => ({
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.price,
          })),
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/pedidos?id=${data.data.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
          <ArrowLeft size={20} />
        </button>
        <PageHeader title="Nuevo Pedido" description="Crea un nuevo pedido manualmente" />
      </div>

      {/* Customer Selection */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Cliente</h3>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Seleccionar cliente...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.fullName} - {c.email || c.phone || 'Sin contacto'}</option>
          ))}
        </select>
        {customers.length === 0 && (
          <p className="text-xs text-gray-500 mt-2">
            No hay clientes.{' '}
            <a href="/clientes/nuevo" className="text-brand-400 hover:underline">Crear uno nuevo</a>
          </p>
        )}
      </div>

      {/* Add Products */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Agregar Productos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {products.map((product) =>
            product.variants.map((variant) => {
              const stock = variant.inventory?.[0]?.availableQuantity || 0;
              const inCart = items.find(i => i.variantId === variant.id);
              return (
                <button
                  key={variant.id}
                  onClick={() => addItem(variant, product)}
                  disabled={stock <= 0}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{variant.sku} - S/ {Number(variant.price).toFixed(2)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    {inCart ? (
                      <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full">x{inCart.quantity}</span>
                    ) : (
                      <span className="text-xs text-gray-500">Stock: {stock}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Items del Pedido ({items.length})</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Selecciona productos de arriba</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.variantId} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.sku} - S/ {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    className="w-7 h-7 bg-gray-700 rounded-lg text-white flex items-center justify-center hover:bg-gray-600"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    className="w-7 h-7 bg-gray-700 rounded-lg text-white flex items-center justify-center hover:bg-gray-600"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-sm font-medium text-brand-400 w-20 text-right">
                  S/ {(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="border-t border-gray-800 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">S/ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">IGV (18%)</span>
              <span className="text-white">S/ {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span className="text-white">Total</span>
              <span className="text-brand-400">S/ {total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Notas (opcional)</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Instrucciones especiales, notas del pedido..."
          rows={3}
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedCustomer || items.length === 0 || saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
          Crear Pedido
        </button>
      </div>
    </div>
  );
}
