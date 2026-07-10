import type { Metadata, Viewport } from 'next';
import './globals.css';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import SessionProvider from '@/components/providers/SessionProvider';
import ExitIntentPopup from '@/components/ui/ExitIntentPopup';

export const metadata: Metadata = {
  title: 'AdriSu Kids - Muebles para Bebes',
  description: 'Todo lo que tu bebe necesita: camas, sillas, carritos y decoracion. Calidad y seguridad al mejor precio.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <SessionProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
          <ExitIntentPopup />
        </SessionProvider>
      </body>
    </html>
  );
}
