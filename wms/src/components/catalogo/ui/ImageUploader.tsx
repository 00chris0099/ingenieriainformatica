'use client';

import { useState, useRef, useCallback, memo } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import UploadProgress from './UploadProgress';

const MAX_IMAGES = 5;

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  label?: string;
}

const ImageUploader = memo(function ImageUploader({ images, onImagesChange, label = 'Imagenes' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadToImgBB = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.url) {
        return data.url;
      }
      console.error('Upload failed:', data.error);
      return null;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));

    if (images.length + imageFiles.length > MAX_IMAGES) {
      alert(`Maximo ${MAX_IMAGES} imagenes permitidas`);
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      setUploadProgress(Math.round(((i) / imageFiles.length) * 100));
      // Compress image then upload to imgBB
      const compressed = await compressImage(imageFiles[i]);
      const url = await uploadToImgBB(compressed);
      if (url) {
        uploadedUrls.push(url);
      }
    }

    if (uploadedUrls.length > 0) {
      onImagesChange([...images, ...uploadedUrls]);
      setUploadStatus('success');
    } else {
      setUploadStatus('error');
    }

    setUploading(false);
    setTimeout(() => setUploadStatus('idle'), 2000);
  }, [images, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-xs text-gray-500">{images.length}/{MAX_IMAGES}</span>
      </div>

      {/* Upload Progress */}
      <UploadProgress progress={uploadProgress} status={uploadStatus} />

      {/* Upload Zone */}
      {images.length < MAX_IMAGES && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-brand-500 bg-brand-500/10'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-brand-400" />
              <p className="text-sm text-gray-400">Subiendo imagen...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={24} className="text-gray-500" />
              <p className="text-sm text-gray-400">
                Arrastra imagenes aqui o <span className="text-brand-400">click para seleccionar</span>
              </p>
              <p className="text-xs text-gray-600">PNG, JPG, WEBP (max 5MB cada una)</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((url, index) => (
            <div
              key={url}
              className="relative group aspect-square rounded-lg overflow-hidden bg-gray-800 border border-gray-700"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              {index === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-brand-600 text-white text-[10px] font-medium rounded">
                  Principal
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {index > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); moveImage(index, index - 1); }}
                    className="p-1 bg-gray-800/80 rounded hover:bg-gray-700"
                    title="Mover atras"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                  className="p-1 bg-red-600/80 rounded hover:bg-red-500"
                  title="Eliminar"
                >
                  <X size={12} />
                </button>
                {index < images.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); moveImage(index, index + 1); }}
                    className="p-1 bg-gray-800/80 rounded hover:bg-gray-700"
                    title="Mover adelante"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ImageUploader;
