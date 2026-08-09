'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2, X } from 'lucide-react'

interface ImageUploadFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  placeholder?: string
  previewClass?: string
  hint?: string
}

/**
 * Image field with upload-from-device: picks a file, uploads it to /api/v1/upload
 * (imgbb) and fills the field with the returned URL. The URL input remains for
 * pasting external links, and a live preview shows the current image.
 */
export default function ImageUploadField({ label, value, onChange, placeholder, previewClass, hint }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    setError('')
    if (!file.type.startsWith('image/')) { setError('Solo se permiten archivos de imagen'); return }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen supera los 5 MB'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/v1/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok && data?.success && data.url) {
        onChange(data.url)
      } else {
        setError(data?.error || 'No se pudo subir la imagen. Revisa la configuración de subida.')
      }
    } catch {
      setError('Error de conexión al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="form-label text-[11px] font-bold">{label}</label>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-all disabled:opacity-50 shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
          title="Subir imagen desde tu dispositivo"
        >
          {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
          {uploading ? 'Subiendo…' : 'Subir'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'https://… o sube desde tu dispositivo'}
          className="input-field text-xs font-mono flex-1 min-w-0"
        />
        {value && (
          <button type="button" onClick={() => onChange('')} className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0" title="Quitar imagen">
            <X size={12} />
          </button>
        )}
      </div>
      {value ? (
        <img src={value} alt="" className={`mt-2 rounded-xl border border-[var(--color-border)] object-cover bg-white ${previewClass || 'h-16 w-16'}`} />
      ) : null}
      {error && <p className="text-[10px] text-[var(--color-error)] mt-1">{error}</p>}
      {hint && !error && <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">{hint}</p>}
    </div>
  )
}
