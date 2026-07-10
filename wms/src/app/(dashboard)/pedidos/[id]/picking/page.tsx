'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, Package, Search } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function PickingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pickedItems, setPickedItems] = useState<Record<string, number>>({});

  const fetchOrder = useCallback(async () => {
    if (!orderId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.data);
        // Initialize picked quantities
        const initial: Record<string, number> = {};
        data.data.items?.forEach((item: any) => {
          initial[item.id] = 0;
        });
        setPickedItems(initial);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleScan = () => {
    if (!scanInput.trim() || !order) return;

    const item = order.items?.find((i: any) =>
      i.sku.toLowerCase() === scanInput.toLowerCase()
    );

    if (item) {
      const currentPicked = pickedItems[item.id] || 0;
      if (currentPicked < item.quantity) {
        setPickedItems({
          ...pickedItems,
          [item.id]: currentPicked + 1,
        });
        setScanResult({
          success: true,
          message: `${item.productName} - ${currentPicked + 1}/${item.quantity} escaneados`,
        });
      } else {
        setScanResult({
          success: false,
          message: `Todos los items de ${item.productName} ya fueron surtidos`,
        });
      }
    } else {
      setScanResult({
        success: false,
        message: `SKU "${scanInput}" no encontrado en este pedido`,
      });
    }

    setScanInput('');
    setTimeout(() => setScanResult(null), 3000);
  };

  const markItemPicked = (itemId: string) => {
    const item = order.items?.find((i: any) => i.id === itemId);
    if (item) {
      setPickedItems({
        ...pickedItems,
        [itemId]: item.quantity,
      });
    }
  };

  const allPicked = order?.items?.every((item: any) =>
    (pickedItems[item.id] || 0) >= item.quantity
  );

  const pickedCount = order?.items?.filter((item: any) =>
    (pickedItems[item.id] || 0) >= item.quantity
  ).length || 0;

  const handleComplete = async () => {
    if (!orderId) return;
    setSaving(true);
    try {
      await fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'packing' }),
      });
      router.push(`/pedidos?id=${orderId}`);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 text-gray-500">
        Pedido no encontrado
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
          <ArrowLeft size={20} />
        </button>
        <PageHeader
          title={`Picking - ${order.orderNumber}`}
          description={`${pickedCount}/${order.items?.length || 0} items surtidos`}
        />
      </div>

      {/* Progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progreso de Surtido</span>
          <span className="text-sm font-medium text-brand-400">
            {Math.round((pickedCount / (order.items?.length || 1)) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(pickedCount / (order.items?.length || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Scanner */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Escanear Producto</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Escanear o ingresar SKU..."
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={handleScan}
            disabled={!scanInput.trim()}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            <Search size={16} /> Verificar
          </button>
        </div>
        {scanResult && (
          <div className={`mt-3 p-3 rounded-lg ${scanResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <p className={`text-sm ${scanResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {scanResult.message}
            </p>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Productos a Surtir</h3>
        <div className="space-y-2">
          {order.items?.map((item: any) => {
            const picked = pickedItems[item.id] || 0;
            const isComplete = picked >= item.quantity;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isComplete ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-800'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isComplete ? 'bg-green-500/20' : 'bg-gray-700'
                }`}>
                  {isComplete ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : (
                    <Package size={16} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">{item.sku}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${isComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                    {picked}/{item.quantity}
                  </span>
                  {!isComplete && (
                    <button
                      onClick={() => markItemPicked(item.id)}
                      className="px-3 py-1 bg-brand-600 text-white text-xs rounded-lg hover:bg-brand-700"
                    >
                      Surtir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={!allPicked || saving}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
        {allPicked ? 'Marcar como Surtido y Pasar a Packing' : `Faltan ${(order.items?.length || 0) - pickedCount} items por surtir`}
      </button>
    </div>
  );
}
