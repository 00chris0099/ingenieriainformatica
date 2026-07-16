import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/checkout/'],
      },
    ],
    sitemap: 'https://adriskids.com/sitemap.xml',
  };
}
