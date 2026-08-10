import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, apiPaginated, getSearchParam, parsePagination } from '@/lib/api';
import { SUPER_ADMIN_EMAIL } from '@/lib/super-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = getSearchParam(searchParams, 'q') || '';
    const { page, limit, offset } = parsePagination(searchParams);

    // ?table=customer → solo registros de la tabla customers (compradores reales,
    // con ids válidos para pedidos). Sin el filtro se devuelve la vista mixta de Clientes.
    const onlyCustomers = searchParams.get('table') === 'customer';
    if (onlyCustomers) {
      const where: any = search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};
      const [records, total] = await Promise.all([
        prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' }, skip: offset, take: limit }),
        prisma.customer.count({ where }),
      ]);
      return apiPaginated(records, total, page, limit);
    }

    let userRecords: any[] = [];
    let customerRecords: any[] = [];

    // 1. Fetch Users table (Google OAuth + Admins + Registered Users)
    try {
      userRecords = await prisma.user.findMany({
        where: search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.warn('[CUSTOMERS API] prisma.user query failed:', (e as any)?.message?.slice(0, 80));
    }

    // 2. Fetch Customers table (Store Customers / E-Commerce buyers)
    try {
      customerRecords = await prisma.customer.findMany({
        where: search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.warn('[CUSTOMERS API] prisma.customer query failed:', (e as any)?.message?.slice(0, 80));
    }

    const seenEmails = new Set<string>();
    const combinedList: any[] = [];

    // Map User records first
    for (const u of userRecords) {
      const emailKey = (u.email || '').toLowerCase().trim();
      if (!emailKey) continue;

      seenEmails.add(emailKey);

      const isGoogle = !!(u.avatarUrl && u.avatarUrl.includes('googleusercontent'))
        || (!u.passwordHash && !u.password && !!u.avatarUrl)
        || u.email === SUPER_ADMIN_EMAIL;

      combinedList.push({
        id: u.id,
        source: isGoogle ? 'Google OAuth' : 'Registro Web',
        customerType: u.role === 'super_admin' ? 'Super Admin' : (u.role === 'admin' ? 'Admin' : 'Cliente VPS'),
        email: u.email,
        phone: u.phone || null,
        fullName: u.fullName || u.name || u.email?.split('@')[0] || 'Usuario',
        customerTier: (u as any).customerTier || (u.role === 'super_admin' ? 'vip' : 'nuevo'),
        isActive: u.isActive !== false,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      });
    }

    // Map Customer records (avoiding duplicates)
    for (const c of customerRecords) {
      const emailKey = (c.email || '').toLowerCase().trim();
      if (emailKey && seenEmails.has(emailKey)) continue;

      if (emailKey) seenEmails.add(emailKey);

      const isGoogle = c.source === 'google' || c.source === 'Google OAuth';

      combinedList.push({
        id: c.id,
        source: isGoogle ? 'Google OAuth' : (c.source === 'wms' ? 'Registro Web' : (c.source || 'Registro Web')),
        customerType: c.customerType || 'Cliente VPS',
        email: c.email,
        phone: c.phone || null,
        fullName: c.fullName || c.email?.split('@')[0] || 'Cliente',
        customerTier: c.customerTier || 'nuevo',
        isActive: c.isActive !== false,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    }

    // Fallback: Always ensure Super Admin anchillo00@gmail.com is present
    if (!seenEmails.has(SUPER_ADMIN_EMAIL)) {
      combinedList.unshift({
        id: 'super-admin-root-user',
        source: 'Google OAuth',
        customerType: 'Super Admin',
        email: SUPER_ADMIN_EMAIL,
        phone: null,
        fullName: 'Pedro Anchillo (Super Admin)',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const total = combinedList.length;
    const paginated = combinedList.slice(offset, offset + limit);

    return apiPaginated(paginated, total, page, limit);
  } catch (error) {
    console.error('[CUSTOMERS API ERROR]', error);
    return apiPaginated([
      {
        id: 'super-admin-root-user',
        source: 'Google OAuth',
        customerType: 'Super Admin',
        email: SUPER_ADMIN_EMAIL,
        phone: null,
        fullName: 'Pedro Anchillo (Super Admin)',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ], 1, 1, 10);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, taxId, companyName, customerType, billingAddress, creditLimit, notes, source } = body;

    if (!fullName) return apiError('fullName is required', 400);

    const customer = await prisma.customer.create({
      data: {
        source: source || 'wms',
        customerType: customerType || 'individual',
        fullName,
        email: email || null,
        phone: phone || null,
        companyName: companyName || null,
        taxId: taxId || null,
        billingAddress: billingAddress || {},
        creditLimit: typeof creditLimit === 'number' ? creditLimit : 0,
        notes: notes || null,
      },
    });

    return apiSuccess(customer, 201);
  } catch (error) {
    console.error('[customers] create failed:', (error as Error)?.message?.slice(0, 300));
    return apiError(`Error al crear el cliente: ${(error as Error)?.message?.slice(0, 200) || 'desconocido'}`, 500);
  }
}
