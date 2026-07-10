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

    const [cycleCounts, total] = await Promise.all([
      prisma.cycleCount.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          assignee: { select: { id: true, fullName: true } },
          items: {
            include: {
              variant: { select: { id: true, sku: true, name: true } },
            },
          },
        },
        orderBy: { scheduledDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.cycleCount.count({ where }),
    ]);

    return NextResponse.json({ data: cycleCounts, total, limit, offset });
  } catch (error) {
    console.error('Error fetching cycle counts:', error);
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
    const { warehouseId, scheduledDate, zone, assignedTo, variantIds } = body;

    if (!warehouseId || !scheduledDate) {
      return NextResponse.json(
        { error: 'warehouseId and scheduledDate are required' },
        { status: 400 }
      );
    }

    // Generate count number
    const count = await prisma.cycleCount.count();
    const countNumber = `CC-${String(count + 1).padStart(5, '0')}`;

    // Get inventory items for the warehouse
    const inventoryItems = await prisma.inventory.findMany({
      where: {
        warehouseId,
        ...(variantIds?.length ? { variantId: { in: variantIds } } : {}),
      },
      include: {
        variant: { select: { id: true, sku: true, name: true } },
      },
    });

    const cycleCount = await prisma.cycleCount.create({
      data: {
        countNumber,
        warehouseId,
        scheduledDate: new Date(scheduledDate),
        zone,
        assignedTo,
        status: 'scheduled',
        items: {
          create: inventoryItems.map((item) => ({
            variantId: item.variantId,
            warehouseId: item.warehouseId,
            sku: item.variant.sku,
            productName: item.variant.name,
            expectedQty: item.quantity,
          })),
        },
      },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        assignee: { select: { id: true, fullName: true } },
        items: true,
      },
    });

    return NextResponse.json({ data: cycleCount }, { status: 201 });
  } catch (error) {
    console.error('Error creating cycle count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
