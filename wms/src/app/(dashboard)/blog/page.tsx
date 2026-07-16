'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Loader2, FileText } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/blog/posts?limit=50');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.data?.items || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleNew() {
    setEditingPost(null);
    setShowModal(true);
  }

  function handleEdit(post: any) {
    setEditingPost(post);
    setShowModal(true);
  }

  async function handleDelete(post: any) {
    if (!confirm(`Eliminar "${post.title}"?`)) return;
    try {
      await fetch(`/api/v1/blog/posts/${post.slug}`, { method: 'DELETE' });
      fetchPosts();
    } catch (error) {
      alert('Error al eliminar');
    }
  }

  async function handleTogglePublish(post: any) {
    try {
      await fetch(`/api/v1/blog/posts/${post.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !post.isPublished }),
      });
      fetchPosts();
    } catch (error) {
      alert('Error al actualizar');
    }
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <PageHeader
        title="Blog"
        description={`${posts.length} articulos`}
        actions={
          <button onClick={handleNew} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700">
            <Plus size={18} /> Nuevo Articulo
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-400" /></div>
      ) : posts.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <FileText size={32} className="mx-auto mb-2 text-gray-500" />
          <p className="text-sm text-gray-500">No hay articulos. Crea el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{post.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${post.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {post.isPublished ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.excerpt || post.content?.substring(0, 100)}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {post.category && <span className="bg-gray-800 px-2 py-0.5 rounded">{post.category}</span>}
                    <span>{post.viewCount || 0} vistas</span>
                    <span>{new Date(post.createdAt).toLocaleDateString('es-PE')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button onClick={() => handleTogglePublish(post)} className="p-1.5 text-gray-400 hover:text-white rounded-lg" title={post.isPublished ? 'Despublicar' : 'Publicar'}>
                    <Eye size={14} />
                  </button>
                  <button onClick={() => handleEdit(post)} className="p-1.5 text-gray-400 hover:text-white rounded-lg"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(post)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <BlogPostModal
          post={editingPost}
          onClose={() => { setShowModal(false); setEditingPost(null); }}
          onSaved={() => { setShowModal(false); setEditingPost(null); fetchPosts(); }}
        />
      )}
    </div>
  );
}

function BlogPostModal({ post, onClose, onSaved }: { post: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: post?.title || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    coverImage: post?.coverImage || '',
    category: post?.category || '',
    tags: post?.tags?.join(', ') || '',
    metaTitle: post?.metaTitle || '',
    metaDescription: post?.metaDescription || '',
    isPublished: post?.isPublished || false,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const url = post ? `/api/v1/blog/posts/${post.slug}` : '/api/v1/blog/posts';
      const method = post ? 'PATCH' : 'POST';
      const body = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) onSaved();
      else alert('Error al guardar');
    } catch (error) {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4">{post ? 'Editar Articulo' : 'Nuevo Articulo'}</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Titulo *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contenido *</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" rows={10} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Extracto</label>
            <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ej: Consejos, Noticias"
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags (separados por coma)</label>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="bebe, muebles, seguridad"
                className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Imagen de portada (URL)</label>
            <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Meta Title (SEO)</label>
              <input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Meta Description (SEO)</label>
              <input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            <span className="text-sm">Publicar inmediatamente</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.title || !form.content}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
