'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * RF-59+60: Google Analytics + Meta Pixel
 * Add to layout to track page views
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
  }
}

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Google Analytics
    if (process.env.NEXT_PUBLIC_GA_ID) {
      window.gtag?.('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: pathname,
      });
    }

    // Meta Pixel
    if (process.env.NEXT_PUBLIC_META_PIXEL_ID) {
      window.fbq?.('track', 'PageView');
    }
  }, [pathname]);

  return <>{children}</>;
}

// Helper functions for tracking events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
};

export const trackPurchase = (transactionId: string, value: number, items: any[]) => {
  if (typeof window !== 'undefined') {
    // Google Analytics
    window.gtag?.('event', 'purchase', {
      transaction_id: transactionId,
      value,
      currency: 'PEN',
      items: items.map(item => ({
        item_id: item.sku,
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    // Meta Pixel
    window.fbq?.('track', 'Purchase', {
      content_ids: items.map(i => i.sku),
      content_type: 'product',
      value,
      currency: 'PEN',
    });
  }
};

export const trackAddToCart = (item: any) => {
  if (typeof window !== 'undefined') {
    window.gtag?.('event', 'add_to_cart', {
      currency: 'PEN',
      value: item.price,
      items: [{ item_id: item.sku, item_name: item.name, quantity: 1, price: item.price }],
    });

    window.fbq?.('track', 'AddToCart', {
      content_ids: [item.sku],
      content_type: 'product',
      value: item.price,
      currency: 'PEN',
    });
  }
};

export const trackBeginCheckout = (value: number, items: any[]) => {
  if (typeof window !== 'undefined') {
    window.gtag?.('event', 'begin_checkout', {
      currency: 'PEN',
      value,
      items: items.map(item => ({
        item_id: item.sku,
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    window.fbq?.('track', 'InitiateCheckout', {
      content_ids: items.map(i => i.sku),
      content_type: 'product',
      value,
      currency: 'PEN',
    });
  }
};
