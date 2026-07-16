import { NextRequest } from 'next/server';

const WMS_URL = process.env.WMS_INTERNAL_URL || process.env.NEXT_PUBLIC_WMS_URL || 'http://localhost:3000';

interface Props { params: { slug: string } }

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const res = await fetch(`${WMS_URL}/api/v1/products/${params.slug}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const data = await res.json();
    const p = data.data;

    if (!p || p.status !== 'active') {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Transform WMS format to tienda format
    const product = {
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      model: p.model || '',
      description: p.description || '',
      shortDescription: p.shortDescription || '',
      brand: p.brand || '',
      status: p.status,
      tags: p.tags || [],
      images: p.images || [],
      height: p.height,
      width: p.width,
      depth: p.depth,
      color: p.color || '',
      materials: p.materials || [],
      recommendedAge: p.recommendedAge || '',
      warrantyDays: p.warrantyDays,
      originCountry: p.originCountry || '',
      weight: p.weight,
      weightUnit: p.weightUnit || 'kg',
      lowStockAlert: p.lowStockAlert,
      priceConfig: p.priceConfig || null,
      discountPopup: p.discountPopup || null,
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
      categoryId: p.categoryId,
      variants: (p.variants || []).map((v: any) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        attributes: v.attributes || {},
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        stock: v.stock || 0,
        isActive: v.isActive !== false,
        images: v.images || [],
        lowStockAlert: v.lowStockAlert,
      })),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };

    return Response.json({ data: product });
  } catch (error) {
    console.error('[Tienda Product Detail] Error fetching from WMS:', error);
    return Response.json({ error: 'Product not found' }, { status: 404 });
  }
}
