'use client';

import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  fileName?: string;
}

export default function UploadProgress({ progress, status, fileName }: UploadProgressProps) {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
      {status === 'uploading' && (
        <>
          <Loader2 size={16} className="animate-spin text-brand-400" />
          <div className="flex-1">
            <p className="text-xs text-gray-300 truncate">{fileName}</p>
            <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-gray-400">{progress}%</span>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle size={16} className="text-green-400" />
          <p className="text-xs text-green-400">Upload complete</p>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle size={16} className="text-red-400" />
          <p className="text-xs text-red-400">Upload failed</p>
        </>
      )}
    </div>
  );
}
