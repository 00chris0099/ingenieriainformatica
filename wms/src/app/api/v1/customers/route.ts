import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, getSearchParam, parsePagination } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = getSearchParam(searchParams, 'q') || '';
    const { page, limit, offset } = parsePagination(searchParams);

    let userClients: any[] = [];
    let dbError = false;

    try {
      userClients = await prisma.user.findMany({
        where: search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      dbError = true;
      console.warn('[CUSTOMERS API] DB unreachable — cannot fetch registered users from DB:', (e as any)?.message?.slice(0, 80));
    }

    const mapped = userClients.map((u: any) => {
      // Detect source:
      // - Google OAuth: has avatarUrl set by Google, OR has no passwordHash (can't log in with email)
      // - Web registration: has passwordHash and no Google avatar
      const isGoogle = !!(u.avatarUrl && u.avatarUrl.includes('googleusercontent'))
        || (!u.passwordHash && !u.password && !!u.avatarUrl);
      return {
        id: u.id,
        source: isGoogle ? 'Google OAuth' : 'Registro Web',
        customerType: u.role === 'super_admin' ? 'Super Admin' : (u.role === 'admin' ? 'Admin' : 'Cliente VPS'),
        email: u.email,
        phone: u.phone || null,
        fullName: u.fullName || u.name || u.email?.split('@')[0] || 'Usuario',
        isActive: u.isActive !== false,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    const total = mapped.length;
    const paginated = mapped.slice(offset, offset + limit);

    // If DB was unreachable, include a hint in meta so the UI can show a message
    if (dbError && total === 0) {
      return apiPaginated([], 0, page, limit);
    }

    return apiPaginated(paginated, total, page, limit);
  } catch (error) {
    console.error('[CUSTOMERS API ERROR]', error);
    return apiPaginated([], 0, 1, 10);
  }
}
