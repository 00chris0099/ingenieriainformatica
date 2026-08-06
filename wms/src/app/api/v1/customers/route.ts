import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, getSearchParam, parsePagination } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = getSearchParam(searchParams, 'q') || '';
    const { page, limit, offset } = parsePagination(searchParams);

    // --- Fetch ALL registered Users (Google OAuth + Email registration) ---
    let userClients: any[] = [];
    try {
      userClients = await prisma.user.findMany({
        where: search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        orderBy: { createdAt: 'desc' },
        // No limit so we get everyone
      });
    } catch (e) {
      console.warn('[CUSTOMERS API] prisma.user.findMany failed — DB may be down:', e);
    }

    // Map to uniform structure
    // avatarUrl is set by Google OAuth login; password being null also implies Google
    const mapped = userClients.map((u: any) => ({
      id: u.id,
      source: (u.avatarUrl || !u.password) ? 'Google OAuth' : 'Registro Web',
      customerType: u.role === 'super_admin' ? 'Super Admin' : (u.role === 'admin' ? 'Admin' : 'Cliente VPS'),
      email: u.email,
      phone: u.phone || null,
      fullName: u.fullName || u.name || u.email?.split('@')[0] || 'Usuario',
      isActive: u.isActive !== false,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    const total = mapped.length;
    const paginated = mapped.slice(offset, offset + limit);

    return apiPaginated(paginated, total, page, limit);
  } catch (error) {
    console.error('[CUSTOMERS API ERROR]', error);
    return apiPaginated([], 0, 1, 10);
  }
}
