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
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [qualityChecks, total] = await Promise.all([
      prisma.qualityCheck.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          inspector: { select: { id: true, fullName: true } },
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
      prisma.qualityCheck.count({ where }),
    ]);

    return NextResponse.json({ data: qualityChecks, total, limit, offset });
  } catch (error) {
    console.error('Error fetching quality checks:', error);
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
    const { type, referenceId, referenceType, warehouseId, inspectorId, items, notes } = body;

    if (!type || !warehouseId || !items?.length) {
      return NextResponse.json({ error: 'type, warehouseId, and items are required' }, { status: 400 });
    }

    // Generate QC number
    const count = await prisma.qualityCheck.count();
    const qcNumber = `QC-${String(count + 1).padStart(5, '0')}`;

    const qualityCheck = await prisma.qualityCheck.create({
      data: {
        qcNumber,
        type,
        referenceId,
        referenceType,
        warehouseId,
        inspectorId,
        status: 'pending',
        notes,
        items: {
          create: items.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            passedQty: 0,
            failedQty: 0,
          })),
        },
      },
      include: {
        warehouse: { select: { id: true, name: true } },
        inspector: { select: { id: true, fullName: true } },
        items: true,
      },
    });

    return NextResponse.json({ data: qualityCheck }, { status: 201 });
  } catch (error) {
    console.error('Error creating quality check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
