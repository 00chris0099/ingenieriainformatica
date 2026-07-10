import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError, checkRateLimit } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';

interface ImportProduct {
  sku?: string;
  name: string;
  model?: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  category?: string;
  status?: string;
  tags?: string;
  height?: number;
  width?: number;
  depth?: number;
  color?: string;
  materials?: string;
  recommendedAge?: string;
  warrantyDays?: number;
  originCountry?: string;
  weight?: number;
  weightUnit?: string;
  lowStockAlert?: number;
  images?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: max 1 import per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(`products-import:${ip}`, 1, 60);
    if (!rateCheck.allowed) return apiError('Too many import requests', 429);

    const body = await request.json();
    const { products, mode = 'create' } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return apiError('Products array is required', 400);
    }

    if (products.length > 100) {
      return apiError('Maximum 100 products per import', 400);
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as { index: number; error: string }[],
    };

    for (let i = 0; i < products.length; i++) {
      const item = products[i] as ImportProduct;

      try {
        // Validate required fields
        if (!item.name) {
          results.errors.push({ index: i, error: 'Name is required' });
          continue;
        }

        // Generate SKU if not provided
        let sku = item.sku;
        if (!sku) {
          const prefix = 'ADK';
          const count = await prisma.product.count();
          sku = `${prefix}-IMP-${String(count + i + 1).padStart(3, '0')}`;
        }

        // Generate slug
        const slug = item.name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Find category if provided
        let categoryId = null;
        if (item.category) {
          const category = await prisma.category.findFirst({
            where: { name: { contains: item.category, mode: 'insensitive' } },
          });
          categoryId = category?.id || null;
        }

        // Parse arrays from strings
        const tags = item.tags ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const materials = item.materials ? item.materials.split(',').map(m => m.trim()).filter(Boolean) : [];
        const images = item.images ? item.images.split(',').map(img => img.trim()).filter(Boolean) : [];

        if (mode === 'update' && item.sku) {
          // Update existing product by SKU
          const existing = await prisma.product.findUnique({ where: { sku: item.sku } });
          if (existing) {
            await prisma.product.update({
              where: { sku: item.sku },
              data: {
                name: item.name,
                model: item.model || null,
                description: item.description || null,
                shortDescription: item.shortDescription || null,
                brand: item.brand || null,
                categoryId,
                status: item.status as any || 'draft',
                tags,
                images,
                height: item.height || null,
                width: item.width || null,
                depth: item.depth || null,
                color: item.color || null,
                materials,
                recommendedAge: item.recommendedAge || null,
                warrantyDays: item.warrantyDays || null,
                originCountry: item.originCountry || null,
                weight: item.weight || null,
                weightUnit: item.weightUnit || 'kg',
                lowStockAlert: item.lowStockAlert || null,
              },
            });
            results.updated++;
            continue;
          }
        }

        // Create new product
        await prisma.product.create({
          data: {
            sku,
            name: item.name,
            slug,
            model: item.model || null,
            description: item.description || null,
            shortDescription: item.shortDescription || null,
            brand: item.brand || null,
            categoryId,
            status: (item.status as any) || 'draft',
            tags,
            images,
            height: item.height || null,
            width: item.width || null,
            depth: item.depth || null,
            color: item.color || null,
            materials,
            recommendedAge: item.recommendedAge || null,
            warrantyDays: item.warrantyDays || null,
            originCountry: item.originCountry || null,
            weight: item.weight || null,
            weightUnit: item.weightUnit || 'kg',
            lowStockAlert: item.lowStockAlert || null,
          },
        });
        results.created++;
      } catch (error: any) {
        results.errors.push({ index: i, error: error.message || 'Unknown error' });
      }
    }

    await invalidateCache('products:*');

    return apiSuccess({
      ...results,
      total: products.length,
    });
  } catch (error) {
    return handleApiError(error, 'products-import');
  }
}
