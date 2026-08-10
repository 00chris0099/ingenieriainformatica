'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Loader2, Plus, Shield, Settings, Edit, CheckCircle, XCircle, Store, Building2, RefreshCw, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

type Tab = 'users' | 'settings';

const defaultRole = { color: 'bg-gray-500/20 text-gray-400', label: 'Solo Lectura' };
const roleConfig: Record<string, { color: string; label: string }> = {
  super_admin: { color: 'bg-red-500/20 text-red-400', label: 'Super Admin' },
  admin: { color: 'bg-purple-500/20 text-purple-400', label: 'Admin' },
  warehouse_manager: { color: 'bg-blue-500/20 text-blue-400', label: 'Gerente' },
  warehouse_staff: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Personal' },
  sales_manager: { color: 'bg-green-500/20 text-green-400', label: 'Gerente Ventas' },
  sales_rep: { color: 'bg-teal-500/20 text-teal-400', label: 'Ventas' },
  readonly: defaultRole,
};

export default function UsuariosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [assignUser, setAssignUser] = useState<any>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('q', search);
      const res = await fetch(`/api/v1/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function handleEdit(user: any) {
    setEditingUser(user);
    setShowModal(true);
  }

  function handleNew() {
    setEditingUser(null);
    setShowModal(true);
  }

  const tabs = [
    { key: 'users' as Tab, label: 'Usuarios', icon: Users },
    { key: 'settings' as Tab, label: 'Configuracion', icon: Settings },
  ];

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <PageHeader
        title="Usuarios y Configuracion"
        description={`${users.length} usuarios registrados`}
        actions={
          activeTab === 'users' && (
            <button onClick={handleNew} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700">
              <Plus size={18} /> Nuevo Usuario
            </button>
          )
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

      {activeTab === 'users' && (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-brand-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => {
                const role = (user.role && roleConfig[user.role]) || defaultRole;
                return (
                  <div key={user.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">
                          {user.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${role.color}`}>
                            {role.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <CheckCircle size={14} className="text-green-400" />
                        ) : (
                          <XCircle size={14} className="text-red-400" />
                        )}
                        <button
                          onClick={() => setAssignUser(user)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="Asignar tiendas virtuales a este usuario"
                        >
                          <Store size={14} />
                          Tiendas
                          {(user._count?.businesses ?? 0) > 0 && (
                            <span className="min-w-[18px] px-1 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 text-center">
                              {user._count.businesses}
                            </span>
                          )}
                        </button>
                        <button onClick={() => handleEdit(user)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                          <Edit size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {users.length === 0 && (
                <div className="text-center py-12 text-gray-500">No hay usuarios</div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Roles y Permisos</h3>
            <div className="space-y-2">
              {Object.entries(roleConfig).map(([key, config]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-gray-400" />
                    <span className="text-sm text-white">{config.label}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.color}`}>{key}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => { setShowModal(false); setEditingUser(null); }}
          onSaved={() => { setShowModal(false); setEditingUser(null); fetchUsers(); }}
        />
      )}

      {assignUser && (
        <StoreAssignModal
          user={assignUser}
          onClose={() => setAssignUser(null)}
          onSaved={() => { fetchUsers(); }}
        />
      )}
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = {
  store: 'Tienda Virtual',
  landing: 'Landing Page',
  corporate: 'Corporativa',
  page: 'Página',
};

function StoreAssignModal({ user, onClose, onSaved }: { user: any; onClose: () => void; onSaved: () => void }) {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', industry: 'general' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bizRes, assignedRes] = await Promise.all([
        fetch('/api/v1/businesses'),
        fetch(`/api/v1/users/${user.id}/businesses`),
      ]);
      const bizData = await bizRes.json();
      const asgData = await assignedRes.json();
      const bizItems = Array.isArray(bizData.data) ? bizData.data : [];
      const asgItems = Array.isArray(asgData.data) ? asgData.data : [];
      setBusinesses(bizItems);
      setAssigned(new Set(asgItems.map((b: any) => b.id)));
      const roleMap: Record<string, string> = {};
      asgItems.forEach((b: any) => { roleMap[b.id] = b.assignedRole || 'owner'; });
      setRoles(roleMap);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las tiendas');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  async function toggle(businessId: string, checked: boolean) {
    setSaving(true);
    setError('');
    try {
      if (checked) {
        const res = await fetch(`/api/v1/users/${user.id}/businesses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId, role: roles[businessId] || 'owner' }),
        });
        if (res.ok) { setAssigned(prev => new Set(prev).add(businessId)); }
        else { const d = await res.json(); setError(d.error || 'No se pudo asignar'); }
      } else {
        const res = await fetch(`/api/v1/users/${user.id}/businesses/${businessId}`, { method: 'DELETE' });
        if (res.ok) {
          setAssigned(prev => { const s = new Set(prev); s.delete(businessId); return s; });
        } else { const d = await res.json(); setError(d.error || 'No se pudo desasignar'); }
      }
    } catch { setError('Error de conexión'); } finally {
      setSaving(false);
      onSaved();
    }
  }

  async function createStore(e: React.FormEvent) {
    e.preventDefault();
    if (!newStore.name.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/v1/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStore.name, industry: newStore.industry }),
      });
      const data = await res.json();
      if (res.ok) {
        const created = data.data;
        // Asignar automáticamente al usuario
        await fetch(`/api/v1/users/${user.id}/businesses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: created.id, role: 'owner' }),
        });
        setNewStore({ name: '', industry: 'general' });
        onSaved();
        load();
      } else {
        setError(data.error || 'No se pudo crear');
      }
    } catch { setError('Error de conexión'); } finally { setCreating(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Store size={16} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Tiendas de {user.fullName || user.email}</h2>
              <p className="text-xs text-gray-500">Asigna una o varias tiendas virtuales. El cliente podrá gestionarlas según su tipo.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={22} className="animate-spin text-amber-400" />
            </div>
          ) : (
            <>
              {businesses.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">Aún no hay tiendas creadas. Crea una abajo.</div>
              ) : (
                <div className="space-y-2">
                  {businesses.map((b) => {
                    const checked = assigned.has(b.id);
                    const pageCount = b.pages?.length ?? b._count?.pages ?? 0;
                    const typeSummary = (b.pages || []).reduce((acc: Record<string, number>, p: any) => {
                      acc[p.type] = (acc[p.type] || 0) + 1;
                      return acc;
                    }, {});
                    return (
                      <div
                        key={b.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                          checked ? 'border-amber-500/40 bg-amber-500/5' : 'border-gray-800 bg-gray-900/60 hover:border-gray-700'
                        }`}
                      >
                        <button
                          onClick={() => toggle(b.id, !checked)}
                          disabled={saving}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            checked ? 'bg-amber-500 border-amber-500' : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          {checked && <CheckCircle size={12} className="text-gray-950" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-gray-400 shrink-0" />
                            <span className="text-sm font-semibold text-white truncate">{b.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400 uppercase">{b.industry}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[11px] text-gray-500">{pageCount} página{pageCount !== 1 ? 's' : ''}</span>
                            {Object.entries(typeSummary).map(([t, n]) => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300">
                                {TYPE_LABEL[t] || t}: {String(n)}
                              </span>
                            ))}
                            {checked && (
                              <select
                                value={roles[b.id] || 'owner'}
                                onChange={(e) => setRoles(prev => ({ ...prev, [b.id]: e.target.value }))}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] bg-gray-800 border border-gray-700 rounded-lg px-1.5 py-0.5 text-gray-300 focus:outline-none"
                              >
                                <option value="owner">Propietario</option>
                                <option value="manager">Gestor</option>
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Crear tienda inline */}
          <form onSubmit={createStore} className="pt-3 mt-2 border-t border-gray-800">
            <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <Plus size={12} /> Crear nueva tienda y asignarla
            </p>
            <div className="flex gap-2">
              <input
                value={newStore.name}
                onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                placeholder="Nombre de la tienda (ej: Boutique María)"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <select
                value={newStore.industry}
                onChange={(e) => setNewStore({ ...newStore, industry: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none"
              >
                <option value="general">General</option>
                <option value="moda">Moda</option>
                <option value="tech">Tecnología</option>
                <option value="salud">Salud</option>
                <option value="gourmet">Gourmet</option>
              </select>
              <button
                type="submit"
                disabled={creating || !newStore.name.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-gray-950 rounded-lg text-xs font-bold hover:bg-amber-400 disabled:opacity-40"
              >
                {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Crear
              </button>
            </div>
          </form>
        </div>

        <div className="flex justify-end px-5 py-3 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 text-gray-200 rounded-lg text-sm hover:bg-gray-700">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onSaved }: { user: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'warehouse_staff',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const url = user ? `/api/v1/users/${user.id}` : '/api/v1/users';
      const method = user ? 'PATCH' : 'POST';
      const body: any = { ...form };
      if (!body.password && user) delete body.password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSaved();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'No se pudo guardar'}`);
      }
    } catch (error) {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 dark:bg-gray-900 border border-gray-800 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-white dark:text-white">{user ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300 dark:text-gray-300">Nombre completo</label>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-800 dark:bg-gray-800 border-gray-700 dark:border-gray-700 text-white dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300 dark:text-gray-300">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-800 dark:bg-gray-800 border-gray-700 dark:border-gray-700 text-white dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300 dark:text-gray-300">{user ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-800 dark:bg-gray-800 border-gray-700 dark:border-gray-700 text-white dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300 dark:text-gray-300">Rol</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-800 dark:bg-gray-800 border-gray-700 dark:border-gray-700 text-white dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="warehouse_manager">Gerente de Almacen</option>
              <option value="warehouse_staff">Personal de Almacen</option>
              <option value="sales_manager">Gerente de Ventas</option>
              <option value="sales_rep">Ventas</option>
              <option value="readonly">Solo Lectura</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300 dark:text-gray-300">Telefono</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-800 dark:bg-gray-800 border-gray-700 dark:border-gray-700 text-white dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
