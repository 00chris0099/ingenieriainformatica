import { NextRequest } from 'next/server';

const WMS_URL = process.env.WMS_INTERNAL_URL || process.env.NEXT_PUBLIC_WMS_URL || 'https://tiendavirtual-adrisuestesiwms.jpq6em.easypanel.host';
const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'https://adrisukids.com';
const WOO_CONFIGURED = !!(process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET && process.env.NEXT_PUBLIC_WORDPRESS_URL);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let rawProducts: any[] = [];

    if (WOO_CONFIGURED) {
      const { getProducts } = await import('@/lib/woocommerce-server');
      const result = await getProducts({ perPage: limit });
      rawProducts = result.products || [];
    } else {
      let page = 1;
      let hasMore = true;
      while (hasMore && rawProducts.length < limit) {
        const res = await fetch(`${WMS_URL}/api/v1/products?limit=50&page=${page}&status=active`);
        if (!res.ok) break;
        const data = await res.json();
        const products = (data.data || []).filter((p: any) => p.status === 'active');
        rawProducts.push(...products);
        hasMore = data.pagination?.hasNext || false;
        page++;
      }
      rawProducts = rawProducts.slice(0, limit);
    }

    const productos = rawProducts.map((p: any) => {
      const basePrice = Number(p.price) || 0;
      const discount = Number(p.discountPercent) || 0;
      const finalPrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100) * 100) / 100 : basePrice;
      const stock = p.stock || 0;
      const image = p.images?.[0] || null;

      return {
        Producto: p.name,
        Descripcion: p.shortDescription || p.description || '',
        Categoria: p.category?.name || '',
        Precio: `S/ ${finalPrice.toFixed(2)}`,
        PrecioOriginal: discount > 0 ? `S/ ${basePrice.toFixed(2)}` : null,
        Descuento: discount > 0 ? `${discount}%` : null,
        'Stock Disponible': stock > 0 ? `${stock} unidades` : 'Agotado',
        'Link de compra': `${STORE_URL}/producto/${p.slug}`,
        'Link de foto': image || 'Sin imagen',
        Tags: p.tags || [],
      };
    });

    return Response.json({ success: true, productos, total: productos.length });
  } catch (error) {
    console.error('[Products All] Error:', error);
    return Response.json({ success: true, productos: [], total: 0 });
  }
}
