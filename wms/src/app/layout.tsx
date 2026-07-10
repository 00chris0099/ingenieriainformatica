import type { Metadata, Viewport } from 'next';
import './globals.css';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { PWAProvider } from '@/components/PWAProvider';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'AdriSu Kids - WMS',
  description: 'Sistema de Gestion de Almacen para AdriSu Kids',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WMS',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-gray-950 text-gray-100 antialiased">
        <AuthProvider>
          <PWAProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </PWAProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
