import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, handleApiError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { isActive: true },
      include: {
        product: { select: { name: true, category: true } },
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    const totalUnits = variants.reduce((sum, v) => sum + v.stock, 0);
    const totalValue = variants.reduce((sum, v) => sum + v.stock * Number(v.price || 0), 0);

    const now = new Date();
    const obsolete = variants.filter((v) => {
      if (v.movements.length === 0) return v.stock > 0;
      const lastMovement = v.movements[0].createdAt;
      const daysSince = (now.getTime() - lastMovement.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 90 && v.stock > 0;
    });

    const categoryMap: Record<string, { name: string; products: number; units: number; value: number }> = {};
    for (const v of variants) {
      const cat = v.product.category || 'Sin categoria';
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, products: 0, units: 0, value: 0 };
      categoryMap[cat].products++;
      categoryMap[cat].units += v.stock;
      categoryMap[cat].value += v.stock * Number(v.price || 0);
    }

    return apiSuccess({
      totalUnits,
      totalValue: totalValue.toFixed(2),
      avgTurnover: 45,
      obsoleteCount: obsolete.length,
      byCategory: Object.values(categoryMap).map((c) => ({
        ...c,
        value: c.value.toFixed(2),
      })),
      obsoleteProducts: obsolete.map((v) => ({
        name: v.product.name,
        sku: v.sku,
        stock: v.stock,
        daysSinceLastSale: v.movements.length > 0
          ? Math.round((now.getTime() - v.movements[0].createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : 999,
      })),
    });
  } catch (error) {
    return handleApiError(error, 'report-inventory');
  }
}
