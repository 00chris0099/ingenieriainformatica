import { MetadataRoute } from 'next';

const BASE_URL = 'https://adriskids.com';
const WMS_URL = process.env.WMS_INTERNAL_URL || 'https://tiendavirtual-adrisuestesiwms.jpq6em.easypanel.host';

async function getProducts(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${WMS_URL}/api/v1/products?limit=100`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const products = data.data?.items || data.data || [];
    return products
      .filter((p: any) => p.status === 'active')
      .map((p: any) => ({
        url: `${BASE_URL}/producto/${p.slug}`,
        lastModified: new Date(p.updatedAt || p.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch {
    return [];
  }
}

async function getBlogPosts(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${WMS_URL}/api/v1/blog/posts?status=published&limit=50`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const posts = data.data?.items || [];
    return posts.map((p: any) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.publishedAt || p.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/tienda`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/carrito`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.3 },
    { url: `${BASE_URL}/checkout`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ];

  const [products, blogPosts] = await Promise.all([getProducts(), getBlogPosts()]);

  return [...staticPages, ...products, ...blogPosts];
}
