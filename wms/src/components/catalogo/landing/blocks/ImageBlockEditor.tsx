'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, X, ImageIcon } from 'lucide-react';

interface ImageBlockEditorProps {
  content: Record<string, any>;
  onUpdate: (content: Record<string, any>) => void;
}

export default function ImageBlockEditor({ content, onUpdate }: ImageBlockEditorProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > 800) { height = (height * 800) / width; width = 800; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            else resolve(file);
          }, 'image/jpeg', 0.7);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadToImgBB = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await fetch('/api/v1/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success && data.url) return data.url;
      return null;
    } catch { return null; }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const url = await uploadToImgBB(compressed);
      if (url) {
        onUpdate({ url });
      }
    } catch {}
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Image Preview */}
      {content.url && (
        <div className="relative group">
          <img src={content.url} alt="" className="w-full h-32 object-cover rounded-lg" />
          <button
            onClick={() => onUpdate({ url: '' })}
            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-gray-800 border border-dashed border-gray-600 rounded-lg text-sm text-gray-300 hover:border-brand-500 hover:bg-brand-500/5 transition-colors"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin text-brand-400" />
          ) : (
            <ImageIcon size={16} />
          )}
          {uploading ? 'Cargando imagen...' : 'Click para seleccionar imagen del dispositivo'}
        </button>
      </div>

      {/* Caption */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Caption (opcional)</label>
        <input
          type="text"
          value={content.caption || ''}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Descripcion de la imagen"
        />
      </div>

      {/* Alignment & Width */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Alineacion</label>
          <select
            value={content.alignment || 'center'}
            onChange={(e) => onUpdate({ alignment: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="left">Izquierda</option>
            <option value="center">Centro</option>
            <option value="right">Derecha</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ancho (%)</label>
          <input
            type="number"
            value={content.width || 100}
            onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 100 })}
            min="10"
            max="100"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  );
}
