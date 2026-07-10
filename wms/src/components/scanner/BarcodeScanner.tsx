'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
  className?: string;
}

export function BarcodeScanner({ onScan, onClose, className = '' }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isScanning]);

  const startScanning = async () => {
    if (!containerRef.current) return;

    try {
      setError(null);
      const scanner = new Html5Qrcode('barcode-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {} // Ignore errors during scanning
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <div className={`relative ${className}`}>
      {!isScanning ? (
        <button
          onClick={startScanning}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700"
        >
          <Camera size={18} />
          Abrir Escáner
        </button>
      ) : (
        <div className="relative">
          <div
            id="barcode-reader"
            ref={containerRef}
            className="w-full max-w-md mx-auto rounded-xl overflow-hidden"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={stopScanning}
              className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70"
            >
              <CameraOff size={18} />
            </button>
            {onClose && (
              <button
                onClick={() => {
                  stopScanning();
                  onClose();
                }}
                className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
