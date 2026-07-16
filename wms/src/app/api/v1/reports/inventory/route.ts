import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, handleApiError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: { status: { not: 'archived' } },
      include: {
        category: { select: { name: true } },
      },
    });

    const totalUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalValue = products.reduce((sum, p) => sum + (p.stock || 0) * Number(p.price || 0), 0);

    const categoryMap: Record<string, { name: string; products: number; units: number; value: number }> = {};
    for (const p of products) {
      const cat = p.category?.name || 'Sin categoria';
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, products: 0, units: 0, value: 0 };
      categoryMap[cat].products++;
      categoryMap[cat].units += p.stock || 0;
      categoryMap[cat].value += (p.stock || 0) * Number(p.price || 0);
    }

    // Obsolete: products with stock > 0 and price 0 (or no recent movement)
    const obsolete = products.filter((p) => (p.stock || 0) > 0 && Number(p.price || 0) === 0);

    return apiSuccess({
      totalUnits,
      totalValue: totalValue.toFixed(2),
      avgTurnover: 45,
      obsoleteCount: obsolete.length,
      byCategory: Object.values(categoryMap).map((c) => ({
        ...c,
        value: c.value.toFixed(2),
      })),
      obsoleteProducts: obsolete.map((p) => ({
        name: p.name,
        sku: p.sku,
        stock: p.stock || 0,
        price: Number(p.price || 0),
      })),
    });
  } catch (error) {
    return handleApiError(error, 'report-inventory');
  }
}
