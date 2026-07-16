import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError, getSearchParam } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = getSearchParam(searchParams, 'format') || 'json';
    const category = getSearchParam(searchParams, 'category');
    const status = getSearchParam(searchParams, 'status');

    const where: any = {};
    if (category) where.category = { slug: category };
    if (status) where.status = status;

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const exportData = products.map((p) => ({
      sku: p.sku,
      name: p.name,
      model: p.model || '',
      description: p.description || '',
      shortDescription: p.shortDescription || '',
      brand: p.brand || '',
      category: p.category?.name || '',
      status: p.status,
      tags: p.tags.join(', '),
      height: p.height ? Number(p.height) : '',
      width: p.width ? Number(p.width) : '',
      depth: p.depth ? Number(p.depth) : '',
      color: p.color || '',
      materials: p.materials.join(', '),
      recommendedAge: p.recommendedAge || '',
      warrantyDays: p.warrantyDays || '',
      originCountry: p.originCountry || '',
      weight: p.weight ? Number(p.weight) : '',
      weightUnit: p.weightUnit || 'kg',
      lowStockAlert: p.lowStockAlert || '',
      images: p.images.join(', '),
      price: Number(p.price || 0),
      stock: p.stock || 0,
      discountPercent: p.discountPercent || 0,
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : '',
      barcode: p.barcode || '',
    }));

    if (format === 'csv') {
      // Flatten for CSV
      const flatData = exportData.map((p) => ({
        sku: p.sku,
        name: p.name,
        model: p.model,
        description: p.description,
        shortDescription: p.shortDescription,
        brand: p.brand,
        category: p.category,
        status: p.status,
        tags: p.tags,
        height: p.height,
        width: p.width,
        depth: p.depth,
        color: p.color,
        materials: p.materials,
        recommendedAge: p.recommendedAge,
        warrantyDays: p.warrantyDays,
        originCountry: p.originCountry,
        weight: p.weight,
        weightUnit: p.weightUnit,
        lowStockAlert: p.lowStockAlert,
        images: p.images,
        price: p.price,
        stock: p.stock,
        discountPercent: p.discountPercent,
      }));

      const headers = Object.keys(flatData[0] || {});
      const csv = [
        headers.join(','),
        ...flatData.map((row) => headers.map((h) => `"${String(row[h as keyof typeof row] || '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="products-${Date.now()}.csv"`,
        },
      });
    }

    // Default: JSON
    return apiSuccess({
      products: exportData,
      total: exportData.length,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error, 'products-export');
  }
}
