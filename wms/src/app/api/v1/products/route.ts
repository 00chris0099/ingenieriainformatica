import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam, handleApiError, withDbFallback, checkRateLimit, validate } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';
import { generateSequentialSku } from '@/lib/sku-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = getSearchParam(searchParams, 'q');
    const category = getSearchParam(searchParams, 'category');
    const status = getSearchParam(searchParams, 'status');
    const { page, limit, offset } = parsePagination(searchParams);

    const cacheKey = `products:${page}:${limit}:${search}:${category}:${status}`;

    const result = await cached(cacheKey, () =>
      withDbFallback(
        async () => {
          const where: any = {};
          if (status) where.status = status;
          if (category) where.category = { slug: category };
          if (search) {
            where.OR = [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ];
          }

          const [products, total] = await Promise.all([
            prisma.product.findMany({
              where,
              include: { category: true },
              orderBy: { createdAt: 'desc' },
              skip: offset,
              take: limit,
            }),
            prisma.product.count({ where }),
          ]);

          return { products, total };
        },
        () => ({ products: [], total: 0 })
      ), 60
    );

    const mapped = result.products.map((p: any) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      model: p.model,
      description: p.description || '',
      shortDescription: p.shortDescription || '',
      category: p.category?.name || null,
      categoryId: p.categoryId,
      status: p.status,
      images: p.images,
      tags: p.tags,
      height: p.height ? Number(p.height) : null,
      width: p.width ? Number(p.width) : null,
      depth: p.depth ? Number(p.depth) : null,
      color: p.color,
      materials: p.materials || [],
      recommendedAge: p.recommendedAge,
      warrantyDays: p.warrantyDays,
      originCountry: p.originCountry,
      weight: p.weight ? Number(p.weight) : null,
      weightUnit: p.weightUnit,
      lowStockAlert: p.lowStockAlert,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      costPrice: p.costPrice ? Number(p.costPrice) : null,
      stock: p.stock,
      discountPercent: p.discountPercent ? Number(p.discountPercent) : null,
      barcode: p.barcode,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return apiPaginated(mapped, result.total, page, limit);
  } catch (error) {
    return handleApiError(error, 'products-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API] POST /api/v1/products called');
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(`products-create:${ip}`, 10, 60);
    if (!rateCheck.allowed) return apiError('Too many requests', 429);

    const body = await request.json();
    console.log('[API] Body received:', { name: body.name, price: body.price });

    const validationError = validate(body, {
      name: { required: true, type: 'string', min: 1, max: 200 },
    });
    if (validationError) return apiError(validationError, 400);

    const {
      sku: requestedSku, name, model, description, shortDescription, categoryId, status, tags, images,
      height, width, depth, color, materials, recommendedAge, warrantyDays, originCountry,
      weight, weightUnit, lowStockAlert, price, compareAtPrice, costPrice, stock, discountPercent, barcode,
    } = body;

    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let sku = requestedSku;
    if (!sku) {
      let categoryName = null;
      if (categoryId) {
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        categoryName = category?.name;
      }
      sku = await generateSequentialSku(categoryName);
    }

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        slug,
        model: model || null,
        description: description || null,
        shortDescription: shortDescription || null,
        categoryId: categoryId || null,
        status: status || 'active',
        tags: tags || [],
        images: images || [],
        height: height || null,
        width: width || null,
        depth: depth || null,
        color: color || null,
        materials: materials || [],
        recommendedAge: recommendedAge || null,
        warrantyDays: warrantyDays || null,
        originCountry: originCountry || null,
        weight: weight || null,
        weightUnit: weightUnit || 'kg',
        lowStockAlert: lowStockAlert || null,
        price: price || 0,
        compareAtPrice: compareAtPrice || null,
        costPrice: costPrice || null,
        stock: stock || 0,
        discountPercent: discountPercent || null,
        barcode: barcode || null,
      },
      include: { category: true },
    });

    await invalidateCache('products:*');
    return apiSuccess(product, 201);
  } catch (error: any) {
    if (error.code === 'P2002') return apiError('A product with this SKU already exists', 409);
    return handleApiError(error, 'products-create');
  }
}
