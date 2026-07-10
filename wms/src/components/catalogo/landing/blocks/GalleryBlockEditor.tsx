'use client';

import { Plus, X, GripVertical, Upload, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';

interface GalleryBlockEditorProps {
  content: Record<string, any>;
  onUpdate: (content: Record<string, any>) => void;
}

export default function GalleryBlockEditor({ content, onUpdate }: GalleryBlockEditorProps) {
  const images = content.images || [];
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addImage = () => {
    if (images.length < 6) {
      onUpdate({ images: [...images, ''] });
    }
  };

  const removeImage = (index: number) => {
    if (images.length > 1) {
      const newImages = images.filter((_: string, i: number) => i !== index);
      onUpdate({ images: newImages });
    }
  };

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

  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const compressed = await compressImage(file);
      const url = await uploadToImgBB(compressed);
      if (url) {
        const newImages = [...images];
        newImages[index] = url;
        onUpdate({ images: newImages });
      }
    } catch {}
    setUploadingIndex(null);
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-500">Imagenes ({images.length}/6)</label>
        <button
          type="button"
          onClick={addImage}
          disabled={images.length >= 6}
          className="flex items-center gap-1 px-2 py-1 text-xs text-brand-400 bg-brand-500/10 rounded-lg hover:bg-brand-500/20 disabled:opacity-50"
        >
          <Plus size={10} /> Agregar
        </button>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Columnas</label>
        <select
          value={content.columns || 2}
          onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value={2}>2 columnas</option>
          <option value={3}>3 columnas</option>
          <option value={4}>4 columnas</option>
        </select>
      </div>

      <div className="space-y-2">
        {images.map((url: string, index: number) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-2">
              <GripVertical size={12} className="text-gray-600" />
              {url && (
                <img src={url} alt="" className="w-10 h-10 rounded object-cover" />
              )}
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  const newImages = [...images];
                  newImages[index] = e.target.value;
                  onUpdate({ images: newImages });
                }}
                placeholder={`URL imagen ${index + 1}`}
                className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="p-1 text-gray-500 hover:text-red-400"
              >
                <X size={12} />
              </button>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <input
                ref={(el) => { fileInputRefs.current[index] = el; }}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(index, e)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRefs.current[index]?.click()}
                disabled={uploadingIndex === index}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 bg-gray-800 rounded hover:bg-gray-700"
              >
                {uploadingIndex === index ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                {uploadingIndex === index ? 'Cargando...' : 'Subir desde dispositivo'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
