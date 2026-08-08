import { NextRequest } from 'next/server';
import { apiPaginated, parsePagination, getSearchParam } from '@/lib/api';
import { BUILTIN_TEMPLATES } from '@/lib/builtinTemplates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = getSearchParam(searchParams, 'q') || '';
    const category = getSearchParam(searchParams, 'category');
    const { page, limit, offset } = parsePagination(searchParams);

    let filtered = BUILTIN_TEMPLATES;

    if (category && category !== 'all') {
      filtered = filtered.filter(t =>
        (t as any).type === category ||
        t.category === category ||
        t.category === 'ecommerce' && category === 'store' ||
        t.industry === category
      );
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }

    const paginated = filtered.slice(offset, offset + limit);
    return apiPaginated(paginated, filtered.length, page, limit);
  } catch (error) {
    return apiPaginated(BUILTIN_TEMPLATES, BUILTIN_TEMPLATES.length, 1, 10);
  }
}
