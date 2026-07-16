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
    const assignedTo = searchParams.get('assigned_to');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;

    const [pickLists, total] = await Promise.all([
      prisma.pickList.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          assignee: { select: { id: true, fullName: true } },
          items: {
            include: {
              product: { select: { id: true, sku: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.pickList.count({ where }),
    ]);

    return NextResponse.json({ data: pickLists, total, limit, offset });
  } catch (error) {
    console.error('Error fetching pick lists:', error);
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
    const { warehouseId, orderIds, zone, priority, assignedTo } = body;

    if (!warehouseId || !orderIds?.length) {
      return NextResponse.json({ error: 'warehouseId and orderIds are required' }, { status: 400 });
    }

    // Generate pick number
    const count = await prisma.pickList.count();
    const pickNumber = `PK-${String(count + 1).padStart(5, '0')}`;

    // Get orders with their items
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: { items: true },
    });

    // Create pick list with items
    const pickList = await prisma.pickList.create({
      data: {
        pickNumber,
        warehouseId,
        assignedTo,
        zone,
        priority: priority || 0,
        status: assignedTo ? 'assigned' : 'draft',
        items: {
          create: orders.flatMap((order) =>
            order.items.map((item) => ({
              orderId: order.id,
              productId: item.productId || '',
              sku: item.sku,
              productName: item.productName,
              quantity: item.quantity,
              locationCode: null,
            }))
          ),
        },
      },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        assignee: { select: { id: true, fullName: true } },
        items: true,
      },
    });

    return NextResponse.json({ data: pickList }, { status: 201 });
  } catch (error) {
    console.error('Error creating pick list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
