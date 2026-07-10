import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

interface Props {
  params: { id: string };
}

// GET: List versions for a product
export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const product = await prisma.product.findUnique({ where: { id: params.id } });
    if (!product) return apiError('Product not found', 404);

    const versions = await prisma.productVersion.findMany({
      where: { productId: params.id },
      orderBy: { version: 'desc' },
      take: 50,
    });

    return apiSuccess(versions);
  } catch (error) {
    return handleApiError(error, 'versions-list');
  }
}

// POST: Create a new version (snapshot)
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { variants: true },
    });
    if (!product) return apiError('Product not found', 404);

    const body = await request.json().catch(() => ({}));
    const { authorName, changeType = 'manual' } = body;

    // Get last version number
    const lastVersion = await prisma.productVersion.findFirst({
      where: { productId: params.id },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastVersion?.version || 0) + 1;

    // Create snapshot
    const snapshot = {
      ...product,
      variants: product.variants.map(v => ({
        ...v,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        costPrice: v.costPrice ? Number(v.costPrice) : null,
      })),
    };

    // Calculate diff from previous version
    let diff = null;
    if (lastVersion) {
      const prevSnapshot = lastVersion.snapshot as any;
      const changes: string[] = [];

      // Compare basic fields
      const fieldsToCompare = ['name', 'description', 'brand', 'model', 'status', 'sku'];
      for (const field of fieldsToCompare) {
        if (snapshot[field] !== prevSnapshot[field]) {
          changes.push(`${field}: "${prevSnapshot[field]}" → "${snapshot[field]}"`);
        }
      }

      // Compare numeric fields
      const numericFields = ['weight', 'height', 'width', 'depth', 'warrantyDays', 'lowStockAlert'];
      for (const field of numericFields) {
        if (snapshot[field] !== prevSnapshot[field]) {
          changes.push(`${field}: ${prevSnapshot[field]} → ${snapshot[field]}`);
        }
      }

      // Compare array fields
      const arrayFields = ['tags', 'images', 'materials'];
      for (const field of arrayFields) {
        const prev = JSON.stringify(prevSnapshot[field] || []);
        const curr = JSON.stringify(snapshot[field] || []);
        if (prev !== curr) {
          changes.push(`${field} updated`);
        }
      }

      // Compare variants
      const prevVariants = prevSnapshot.variants?.length || 0;
      const currVariants = snapshot.variants?.length || 0;
      if (prevVariants !== currVariants) {
        changes.push(`variants: ${prevVariants} → ${currVariants}`);
      }

      diff = changes.length > 0 ? { changes, timestamp: new Date().toISOString() } : null;
    }

    const version = await prisma.productVersion.create({
      data: {
        productId: params.id,
        version: nextVersion,
        snapshot,
        diff,
        changeType,
        authorName: authorName || 'Sistema',
      },
    });

    return apiSuccess(version, 201);
  } catch (error) {
    return handleApiError(error, 'version-create');
  }
}
