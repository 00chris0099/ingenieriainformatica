import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const WMS_URL = process.env.WMS_INTERNAL_URL || process.env.NEXT_PUBLIC_WMS_URL || 'https://tiendavirtual-adrisuestesiwms.jpq6em.easypanel.host';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const limit = searchParams.get('limit') || '50';

    const params = new URLSearchParams({ limit });
    if (search) params.set('q', search);
    if (category) params.set('category', category);

    const res = await fetch(`${WMS_URL}/api/v1/products?${params}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return Response.json({ data: [], total: 0 }, { status: 200 });
    }

    const data = await res.json();

    const products = (data.data?.items || data.data || []).map((p: any) => {
      const basePrice = Number(p.price) || 0;
      const discount = p.discountPercent ? Number(p.discountPercent) : 0;
      const finalPrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100) * 100) / 100 : basePrice;

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: p.description || '',
        shortDescription: p.shortDescription || '',
        brand: p.brand || '',
        status: p.status || 'active',
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
        price: basePrice,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        finalPrice,
        discountPercent: discount,
        stock: p.stock || 0,
        barcode: p.barcode,
        category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
        categoryId: p.categoryId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    const activeProducts = products.filter((p: any) => p.status === 'active');

    return Response.json({
      data: activeProducts,
      total: activeProducts.length,
    });
  } catch (error) {
    console.error('[Tienda Products] Error fetching from WMS:', error);
    return Response.json({ data: [], total: 0 }, { status: 200 });
  }
}
