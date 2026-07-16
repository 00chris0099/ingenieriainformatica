'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Bell, Send, Plus, Loader2, CheckCircle, Clock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

type Tab = 'whatsapp' | 'push';

export default function ComunicacionesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('whatsapp');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/notifications?limit=50');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data?.items || data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { key: 'whatsapp' as Tab, label: 'WhatsApp Broadcast', icon: MessageSquare },
    { key: 'push' as Tab, label: 'Notificaciones Push', icon: Bell },
  ];

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <PageHeader
        title="Comunicaciones"
        description="Gestiona WhatsApp broadcasts y notificaciones push"
        actions={
          <button
            onClick={() => activeTab === 'whatsapp' ? setShowBroadcastModal(true) : setShowPushModal(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700"
          >
            <Plus size={18} />
            {activeTab === 'whatsapp' ? 'Nueva Campana' : 'Nueva Notificacion'}
          </button>
        }
      />

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-brand-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* WhatsApp Broadcast Tab */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Enviar mensaje masivo por WhatsApp</h3>
            <p className="text-xs text-gray-500 mb-4">
              Selecciona clientes y envia un mensaje personalizado via WhatsApp Business API.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">0</div>
                <div className="text-xs text-gray-500">Enviados hoy</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-400">0</div>
                <div className="text-xs text-gray-500">Entregados</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-400">0</div>
                <div className="text-xs text-gray-500">Pendientes</div>
              </div>
            </div>
          </div>

          {/* Recent broadcasts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Campanas recientes</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-400" /></div>
            ) : notifications.filter(n => n.type === 'whatsapp_broadcast').length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No hay campanas enviadas aun</div>
            ) : (
              <div className="space-y-2">
                {notifications.filter(n => n.type === 'whatsapp_broadcast').slice(0, 5).map((notif) => (
                  <div key={notif.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare size={16} className="text-green-400" />
                      <div>
                        <p className="text-sm text-white">{notif.subject}</p>
                        <p className="text-xs text-gray-500">{notif.body}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleDateString('es-PE')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Push Notifications Tab */}
      {activeTab === 'push' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Notificaciones Push (PWA)</h3>
            <p className="text-xs text-gray-500 mb-4">
              Envia notificaciones push a los dispositivos que tengan la PWA instalada.
            </p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-400">0</div>
                <div className="text-xs text-gray-500">Dispositivos activos</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">0</div>
                <div className="text-xs text-gray-500">Enviadas hoy</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Historial de notificaciones</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-400" /></div>
            ) : notifications.filter(n => n.type === 'push').length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No hay notificaciones enviadas aun</div>
            ) : (
              <div className="space-y-2">
                {notifications.filter(n => n.type === 'push').slice(0, 10).map((notif) => (
                  <div key={notif.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell size={16} className="text-blue-400" />
                      <div>
                        <p className="text-sm text-white">{notif.subject}</p>
                        <p className="text-xs text-gray-500">{notif.body}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleDateString('es-PE')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Broadcast Modal */}
      {showBroadcastModal && (
        <BroadcastModal onClose={() => setShowBroadcastModal(false)} onSent={() => { setShowBroadcastModal(false); fetchNotifications(); }} />
      )}

      {/* Push Notification Modal */}
      {showPushModal && (
        <PushModal onClose={() => setShowPushModal(false)} onSent={() => { setShowPushModal(false); fetchNotifications(); }} />
      )}
    </div>
  );
}

function BroadcastModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [form, setForm] = useState({ title: '', message: '', targetAll: true });
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch('/api/v1/customers?limit=100')
      .then(res => res.json())
      .then(data => setCustomers(data.data?.items || []))
      .catch(() => {});
  }, []);

  async function handleSend() {
    setSending(true);
    try {
      const res = await fetch('/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.title,
          body: form.message,
          type: 'whatsapp_broadcast',
          targetAll: form.targetAll,
          customerIds: form.targetAll ? undefined : selectedCustomers,
        }),
      });
      if (res.ok) onSent();
      else alert('Error al enviar');
    } catch (error) {
      alert('Error al enviar');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">Nueva Campana WhatsApp</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Asunto</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Oferta de Navidad"
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mensaje</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Hola {nombre}, tenemos una oferta especial para ti..."
              className="w-full border rounded-lg px-3 py-2" rows={4} />
            <p className="text-xs text-gray-500 mt-1">Variables: {'{nombre}'}, {'{ultimo_pedido}'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Destinatarios</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" checked={form.targetAll} onChange={() => setForm({ ...form, targetAll: true })} />
                <span className="text-sm">Todos los clientes ({customers.length})</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={!form.targetAll} onChange={() => setForm({ ...form, targetAll: false })} />
                <span className="text-sm">Seleccionar</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSend} disabled={sending || !form.title || !form.message}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {sending ? 'Enviando...' : 'Enviar Campana'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PushModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [form, setForm] = useState({ title: '', body: '', url: '' });
  const [sending, setSending] = useState(false);

  async function handleSend() {
    setSending(true);
    try {
      const res = await fetch('/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.title,
          body: form.body,
          type: 'push',
          url: form.url || undefined,
        }),
      });
      if (res.ok) onSent();
      else alert('Error al enviar');
    } catch (error) {
      alert('Error al enviar');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Nueva Notificacion Push</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Titulo</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Nuevo pedido recibido"
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mensaje</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Detalle de la notificacion..."
              className="w-full border rounded-lg px-3 py-2" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL (opcional)</label>
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="/pedidos"
              className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSend} disabled={sending || !form.title || !form.body}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {sending ? 'Enviando...' : 'Enviar Notificacion'}
          </button>
        </div>
      </div>
    </div>
  );
}
