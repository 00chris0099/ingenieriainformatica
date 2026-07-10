import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

interface Props {
  params: { id: string };
}

interface CategoryAttribute {
  name: string;
  type: 'text' | 'select' | 'color' | 'number';
  options?: string[]; // Para tipo select
  required?: boolean;
}

// GET: Get attributes for a category
export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, attributes: true },
    });

    if (!category) return apiError('Category not found', 404);

    return apiSuccess({
      categoryId: category.id,
      categoryName: category.name,
      attributes: category.attributes,
    });
  } catch (error) {
    return handleApiError(error, 'category-attributes-get');
  }
}

// PUT: Update attributes for a category
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const category = await prisma.category.findUnique({ where: { id: params.id } });
    if (!category) return apiError('Category not found', 404);

    const body = await request.json();
    const { attributes } = body;

    if (!Array.isArray(attributes)) {
      return apiError('Attributes must be an array', 400);
    }

    // Validate each attribute
    for (const attr of attributes) {
      if (!attr.name || typeof attr.name !== 'string') {
        return apiError('Each attribute must have a name', 400);
      }
      if (!['text', 'select', 'color', 'number'].includes(attr.type)) {
        return apiError(`Invalid attribute type: ${attr.type}`, 400);
      }
      if (attr.type === 'select' && (!Array.isArray(attr.options) || attr.options.length === 0)) {
        return apiError(`Select attribute "${attr.name}" must have options`, 400);
      }
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: { attributes },
      select: { id: true, name: true, attributes: true },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error, 'category-attributes-update');
  }
}
