import { Metadata } from 'next';

const WMS_URL = process.env.WMS_INTERNAL_URL || 'https://tiendavirtual-adrisuestesiwms.jpq6em.easypanel.host';

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${WMS_URL}/api/v1/products/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Producto no encontrado' };

  const price = product.price || 0;
  const image = product.images?.[0] || '';

  return {
    title: `${product.name} | AdriSu Kids`,
    description: product.description || product.shortDescription || `${product.name} - Muebles para bebes de calidad en Peru`,
    openGraph: {
      title: product.name,
      description: product.description || product.shortDescription || '',
      images: image ? [{ url: image, width: 800, height: 600, alt: product.name }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description || '',
      images: image ? [image] : [],
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
