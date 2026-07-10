import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const variantId = searchParams.get('variant_id');
    const expiringSoon = searchParams.get('expiring_soon') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (status) where.status = status;
    if (variantId) where.variantId = variantId;
    if (expiringSoon) {
      where.expirationDate = {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        gte: new Date(),
      };
    }

    const [lots, total] = await Promise.all([
      prisma.lot.findMany({
        where,
        include: {
          variant: { select: { id: true, sku: true, name: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          movements: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.lot.count({ where }),
    ]);

    return NextResponse.json({ data: lots, total, limit, offset });
  } catch (error) {
    console.error('Error fetching lots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { variantId, warehouseId, quantity, manufacturingDate, expirationDate, notes } = body;

    if (!variantId || !warehouseId || !quantity) {
      return NextResponse.json({ error: 'variantId, warehouseId, and quantity are required' }, { status: 400 });
    }

    // Generate lot number
    const count = await prisma.lot.count();
    const lotNumber = `LOT-${String(count + 1).padStart(6, '0')}`;

    const lot = await prisma.lot.create({
      data: {
        lotNumber,
        variantId,
        warehouseId,
        quantity,
        availableQty: quantity,
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        notes,
        status: 'active',
        movements: {
          create: {
            type: 'receive',
            quantity,
            notes: 'Initial lot creation',
          },
        },
      },
      include: {
        variant: { select: { id: true, sku: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: lot }, { status: 201 });
  } catch (error) {
    console.error('Error creating lot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
