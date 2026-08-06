import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = getSearchParam(searchParams, 'q') || '';
    const { page, limit, offset } = parsePagination(searchParams);

    // 1. Fetch registered User clients (Google & Email registrations)
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
      });
    } catch (e) {
      console.warn('[CUSTOMERS GET USER WARNING]', e);
    }

    // 2. Fetch Customer records
    let storeCustomers: any[] = [];
    try {
      storeCustomers = await prisma.customer.findMany({
        where: search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
              ],
            }
          : {},
        include: {
          _count: { select: { orders: true, invoices: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.warn('[CUSTOMERS GET STORE WARNING]', e);
    }

    // Map Users to uniform client structure
    const mappedUsers = userClients.map((u: any) => ({
      id: u.id,
      source: u.avatarUrl ? 'Google OAuth' : 'Registro Web',
      customerType: u.role === 'super_admin' ? 'Super Admin' : 'Cliente VPS',
      email: u.email,
      phone: u.phone || 'N/A',
      fullName: u.fullName || u.email.split('@')[0],
      companyName: 'Tienda Virtual',
      isActive: u.isActive,
      ordersCount: 0,
      createdAt: u.createdAt,
    }));

    // Map Customers
    const mappedCustomers = storeCustomers.map((c: any) => ({
      id: c.id,
      source: c.source || 'Tienda',
      customerType: c.customerType || 'Cliente',
      email: c.email || 'Sin Correo',
      phone: c.phone || 'N/A',
      fullName: c.fullName,
      companyName: c.companyName || 'Empresa',
      isActive: c.isActive,
      ordersCount: c._count?.orders || 0,
      createdAt: c.createdAt,
    }));

    // Combine both arrays (deduplicate by email)
    const emailSet = new Set<string>();
    const combined: any[] = [];

    for (const item of [...mappedUsers, ...mappedCustomers]) {
      if (item.email && !emailSet.has(item.email.toLowerCase())) {
        emailSet.add(item.email.toLowerCase());
        combined.push(item);
      }
    }

    const total = combined.length;
    const paginated = combined.slice(offset, offset + limit);

    return apiPaginated(paginated, total, page, limit);
  } catch (error) {
    console.error('Customers API error:', error);
    // Return empty paginated structure instead of throwing 500 error
    return apiPaginated([], 0, 1, 10);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, customerType, companyName } = body;

    if (!fullName) return apiError('Full name is required', 400);

    const customer = await prisma.customer.create({
      data: {
        source: 'wms',
        fullName,
        email: email || null,
        phone: phone || null,
        customerType: customerType || 'individual',
        companyName: companyName || null,
        creditLimit: 0,
      },
    });

    return apiSuccess(customer, 201);
  } catch (error) {
    return apiError('Error al crear cliente', 500);
  }
}
