import type { Metadata, Viewport } from 'next';
import './globals.css';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import SessionProvider from '@/components/providers/SessionProvider';
import ExitIntentPopup from '@/components/ui/ExitIntentPopup';

export const metadata: Metadata = {
  title: {
    default: 'AdriSu Kids - Muebles para Bebes | Tienda Online Peru',
    template: '%s | AdriSu Kids',
  },
  description: 'Todo lo que tu bebe necesita: camas convertibles, sillas altas, carritos de bebe y decoracion nursery. Calidad y seguridad al mejor precio en Peru.',
  keywords: ['muebles bebe', 'cuna bebe', 'silla alta', 'carrito bebe', 'decoracion nursery', 'tienda bebe peru', 'muebles infantiles'],
  authors: [{ name: 'AdriSu Kids' }],
  creator: 'AdriSu Kids',
  publisher: 'AdriSu Kids',
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: 'https://adriskids.com',
    siteName: 'AdriSu Kids',
    title: 'AdriSu Kids - Muebles para Bebes',
    description: 'Todo lo que tu bebe necesita: camas, sillas, carritos y decoracion. Calidad y seguridad al mejor precio.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AdriSu Kids - Muebles para Bebes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdriSu Kids - Muebles para Bebes',
    description: 'Todo lo que tu bebe necesita: camas, sillas, carritos y decoracion.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
  alternates: {
    canonical: 'https://adriskids.com',
  },
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'AdriSu Kids',
                alternateName: 'AdriSu Kids Muebles para Bebes',
                url: 'https://adriskids.com',
                logo: 'https://adriskids.com/logo.png',
                description: 'Tienda online de muebles para bebes en Peru. Camas convertibles, sillas altas, cochecitos, decoracion nursery y mas.',
                foundingDate: '2024',
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: 'Av. Industrial 123',
                  addressLocality: 'Lima',
                  addressRegion: 'Lima',
                  postalCode: '15001',
                  addressCountry: 'PE',
                },
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: -12.0464,
                  longitude: -77.0428,
                },
                contactPoint: {
                  '@type': 'ContactPoint',
                  telephone: '+51-999-111-222',
                  contactType: 'customer service',
                  areaServed: 'PE',
                  availableLanguage: 'Spanish',
                },
                sameAs: [
                  'https://www.facebook.com/adriskids',
                  'https://www.instagram.com/adriskids',
                  'https://www.tiktok.com/@adriskids',
                ],
                areaServed: { '@type': 'Country', name: 'Peru' },
                makesOffer: {
                  '@type': 'OfferCatalog',
                  name: 'Muebles para Bebes',
                  itemListElement: [
                    { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Camas y Cunas' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Sillas Altas' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Cochecitos' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Decoracion Nursery' } },
                  ],
                },
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'AdriSu Kids',
                url: 'https://adriskids.com',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://adriskids.com/tienda?search={search_term_string}',
                  },
                  'query-input': 'required name=search_term_string',
                },
              },
              {
                '@context': 'https://schema.org',
                '@type': 'LocalBusiness',
                name: 'AdriSu Kids',
                image: 'https://adriskids.com/logo.png',
                url: 'https://adriskids.com',
                telephone: '+51-999-111-222',
                priceRange: '$$',
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: 'Av. Industrial 123',
                  addressLocality: 'Lima',
                  addressRegion: 'Lima',
                  addressCountry: 'PE',
                },
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: -12.0464,
                  longitude: -77.0428,
                },
                openingHoursSpecification: [
                  {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    opens: '09:00',
                    closes: '18:00',
                  },
                  {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: 'Saturday',
                    opens: '09:00',
                    closes: '14:00',
                  },
                ],
                areaServed: { '@type': 'Country', name: 'Peru' },
              },
            ]),
          }}
        />
      </head>
      <body className="min-h-screen">
        <SessionProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
          <ExitIntentPopup />
        </SessionProvider>
      </body>
    </html>
  );
}
