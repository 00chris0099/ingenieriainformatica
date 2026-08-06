'use client';

import { useProductForm } from '../ProductFormContext';
import { Clock, Eye, Megaphone, MessageSquare, Plus, X, Upload } from 'lucide-react';
import type { SocialProofAvatar } from '../ProductFormContext';

const DEFAULT_MESSAGES = [
  '{name} de {city} compró este producto',
  '{name} de {city} acabó de comprar',
  '{name} de {city} se lo llevó',
];

const AVATAR_COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1'];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function UrgencyTab() {
  const {
    promotionBar, updatePromotionBar, togglePromotionBar,
    socialProof, updateSocialProof, toggleSocialProof,
  } = useProductForm();

  const addMessage = () => {
    updateSocialProof({ messages: [...socialProof.messages, ''] });
  };

  const updateMessage = (index: number, value: string) => {
    const updated = [...socialProof.messages];
    updated[index] = value;
    updateSocialProof({ messages: updated });
  };

  const removeMessage = (index: number) => {
    updateSocialProof({ messages: socialProof.messages.filter((_, i) => i !== index) });
  };

  const addAvatar = () => {
    const id = Date.now().toString();
    updateSocialProof({
      avatars: [...socialProof.avatars, { id, imageUrl: '', name: '', city: '' }],
    });
  };

  const updateAvatar = (id: string, updates: Partial<SocialProofAvatar>) => {
    updateSocialProof({
      avatars: socialProof.avatars.map(a => a.id === id ? { ...a, ...updates } : a),
    });
  };

  const removeAvatar = (id: string) => {
    updateSocialProof({ avatars: socialProof.avatars.filter(a => a.id !== id) });
  };

  const uploadAvatarImage = async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/v1/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.url) updateAvatar(id, { imageUrl: data.url });
      }
    } catch (e) {
      console.error('Error uploading avatar:', e);
    }
  };

  const previewAvatar = socialProof.avatars[0];
  const previewMsg = (socialProof.messages[0] || DEFAULT_MESSAGES[0] || '')
    .replace('{name}', previewAvatar?.name || 'María')
    .replace('{city}', previewAvatar?.city || 'Lima')
    .replace('{product}', 'Este producto');

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* PROMOTION BAR */}
      {/* ============================================================ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-red-400" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Barra de Promoción</h3>
              <p className="text-xs text-gray-500">Cuenta regresiva en la parte superior de la página del producto</p>
            </div>
          </div>
          <button
            type="button"
            onClick={togglePromotionBar}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              promotionBar.enabled ? 'bg-red-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                promotionBar.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {promotionBar.enabled && (
          <div className="space-y-4 bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Eye size={12} className="text-gray-500" />
                <span className="text-xs text-gray-500">Vista previa</span>
              </div>
              <div
                className="rounded-lg px-4 py-2 text-center text-sm font-medium"
                style={{ backgroundColor: promotionBar.bgColor, color: promotionBar.textColor }}
              >
                {(promotionBar.message || '¡Oferta por tiempo limitado!')
                  .replace('{hours}', String(promotionBar.hours || 24).padStart(2, '0'))
                  .replace('{minutes}', '00')
                  .replace('{seconds}', '00')}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mensaje de la barra</label>
                <input
                  type="text"
                  value={promotionBar.message}
                  onChange={(e) => updatePromotionBar({ message: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="¡Oferta por tiempo limitado! Quedan {hours}h {minutes}m {seconds}s"
                />
                <p className="text-[10px] text-gray-600 mt-1">
                  Variables: {'{hours}'} {'{minutes}'} {'{seconds}'} — se rellenan automáticamente
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Horas de countdown</label>
                <input
                  type="number"
                  value={promotionBar.hours || 24}
                  onChange={(e) => updatePromotionBar({ hours: parseInt(e.target.value) || 24 })}
                  min="1"
                  max="720"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Color de fondo</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={promotionBar.bgColor} onChange={(e) => updatePromotionBar({ bgColor: e.target.value })} className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer" />
                    <input type="text" value={promotionBar.bgColor} onChange={(e) => updatePromotionBar({ bgColor: e.target.value })} className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Color de texto</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={promotionBar.textColor} onChange={(e) => updatePromotionBar({ textColor: e.target.value })} className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer" />
                    <input type="text" value={promotionBar.textColor} onChange={(e) => updatePromotionBar({ textColor: e.target.value })} className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SOCIAL PROOF — Messages + Avatars combined */}
      {/* ============================================================ */}
      <div className="border-t border-gray-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-blue-400" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Notificaciones de Prueba Social</h3>
              <p className="text-xs text-gray-500">Toasts emergentes mostrando compras recientes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleSocialProof}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              socialProof.enabled ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                socialProof.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {socialProof.enabled && (
          <div className="space-y-4 bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            {/* Preview */}
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Eye size={12} className="text-gray-500" />
                <span className="text-xs text-gray-500">Vista previa del toast</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 flex items-center gap-3 max-w-xs">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ backgroundColor: previewAvatar ? AVATAR_COLORS[hashStr(previewAvatar.name) % AVATAR_COLORS.length] : '#3b82f6' }}
                >
                  {previewAvatar?.imageUrl ? (
                    <img src={previewAvatar.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <span className="text-white text-sm font-bold">{previewAvatar?.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-700">{previewMsg}</p>
                  <p className="text-[10px] text-gray-400">hace 2 min</p>
                </div>
              </div>
            </div>

            {/* Interval */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Intervalo entre notificaciones (segundos)</label>
              <input
                type="number"
                value={socialProof.interval}
                onChange={(e) => updateSocialProof({ interval: parseInt(e.target.value) || 5 })}
                min="3"
                max="60"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <p className="text-[10px] text-gray-600 mt-1">Mínimo 3s, recomendado 5s</p>
            </div>

            {/* ======================================================== */}
            {/* COMBINED: Messages + Avatars in one section */}
            {/* ======================================================== */}
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={14} className="text-blue-400" />
                <span className="text-xs font-medium text-gray-300">Mensajes y Avatares</span>
              </div>
              <p className="text-[10px] text-gray-500">
                Cada avatar se asocia aleatoriamente con un mensaje. Variables: {'{name}'} {'{city}'} {'{product}'}
              </p>

              {/* Messages */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] text-gray-400 font-medium">Plantillas de mensaje</label>
                  <button type="button" onClick={addMessage} className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Plus size={10} /> Agregar
                  </button>
                </div>
                <div className="space-y-1.5">
                  {socialProof.messages.map((msg, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-[10px] text-gray-600 w-4 pt-2 shrink-0">{i + 1}.</span>
                      <input
                        type="text"
                        value={msg}
                        onChange={(e) => updateMessage(i, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        placeholder="{name} de {city} compró este producto"
                      />
                      {socialProof.messages.length > 1 && (
                        <button type="button" onClick={() => removeMessage(i)} className="px-1.5 text-gray-500 hover:text-red-400">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {socialProof.messages.length === 0 && (
                  <button type="button" onClick={() => updateSocialProof({ messages: [...DEFAULT_MESSAGES] })} className="text-[11px] text-gray-500 hover:text-gray-300 underline">
                    Restablecer mensajes predeterminados
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-700/50" />

              {/* Avatars */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] text-gray-400 font-medium">Avatares</label>
                  <button type="button" onClick={addAvatar} className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Plus size={10} /> Agregar avatar
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {socialProof.avatars.map((avatar) => {
                    const bgColor = AVATAR_COLORS[hashStr(avatar.name) % AVATAR_COLORS.length];
                    return (
                      <div key={avatar.id} className="bg-gray-800 border border-gray-700 rounded-lg p-2 space-y-1.5">
                        <div className="relative group">
                          <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center">
                            {avatar.imageUrl ? (
                              <img
                                src={avatar.imageUrl}
                                alt={avatar.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <span className="text-2xl font-bold text-white" style={{ backgroundColor: bgColor, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {avatar.name?.charAt(0) || '?'}
                              </span>
                            )}
                          </div>
                          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center cursor-pointer">
                            <Upload size={14} className="text-white mb-1" />
                            <span className="text-[9px] text-white">Cambiar</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadAvatarImage(avatar.id, file);
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => removeAvatar(avatar.id)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={avatar.name}
                          onChange={(e) => updateAvatar(avatar.id, { name: e.target.value })}
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                          placeholder="Nombre"
                        />
                        <input
                          type="text"
                          value={avatar.city}
                          onChange={(e) => updateAvatar(avatar.id, { city: e.target.value })}
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                          placeholder="Ciudad"
                        />
                      </div>
                    );
                  })}
                </div>
                {socialProof.avatars.length > 0 && (
                  <p className="text-[10px] text-gray-500 mt-2">
                    {socialProof.avatars.length} avatar{socialProof.avatars.length !== 1 ? 'es' : ''} configurado{socialProof.avatars.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
