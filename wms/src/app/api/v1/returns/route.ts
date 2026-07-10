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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (status) where.status = status;

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
          customer: { select: { id: true, fullName: true, email: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              variant: { select: { id: true, sku: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.return.count({ where }),
    ]);

    return NextResponse.json({ data: returns, total, limit, offset });
  } catch (error) {
    console.error('Error fetching returns:', error);
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
    const { customerId, warehouseId, orderId, reason, items } = body;

    if (!customerId || !warehouseId || !items?.length) {
      return NextResponse.json(
        { error: 'customerId, warehouseId, and items are required' },
        { status: 400 }
      );
    }

    // Generate return number
    const count = await prisma.return.count();
    const returnNumber = `RMA-${String(count + 1).padStart(5, '0')}`;

    const returnRecord = await prisma.return.create({
      data: {
        returnNumber,
        customerId,
        warehouseId,
        orderId,
        reason,
        status: 'pending',
        items: {
          create: items.map((item: any) => ({
            variantId: item.variantId,
            sku: item.sku,
            productName: item.productName,
            quantity: item.quantity,
            condition: item.condition || 'good',
            notes: item.notes,
          })),
        },
      },
      include: {
        customer: { select: { id: true, fullName: true } },
        warehouse: { select: { id: true, name: true } },
        items: true,
      },
    });

    return NextResponse.json({ data: returnRecord }, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
