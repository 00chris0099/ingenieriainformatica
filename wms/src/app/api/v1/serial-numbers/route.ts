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
    const search = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (status) where.status = status;
    if (variantId) where.variantId = variantId;
    if (search) {
      where.OR = [
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { variant: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [serialNumbers, total] = await Promise.all([
      prisma.serialNumber.findMany({
        where,
        include: {
          variant: { select: { id: true, sku: true, name: true } },
          warehouse: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.serialNumber.count({ where }),
    ]);

    return NextResponse.json({ data: serialNumbers, total, limit, offset });
  } catch (error) {
    console.error('Error fetching serial numbers:', error);
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
    const { serialNumber, variantId, warehouseId, locationCode, notes } = body;

    if (!serialNumber || !variantId || !warehouseId) {
      return NextResponse.json({ error: 'serialNumber, variantId, and warehouseId are required' }, { status: 400 });
    }

    // Check for duplicate serial number
    const existing = await prisma.serialNumber.findUnique({
      where: { serialNumber },
    });

    if (existing) {
      return NextResponse.json({ error: 'Serial number already exists' }, { status: 409 });
    }

    const sn = await prisma.serialNumber.create({
      data: {
        serialNumber,
        variantId,
        warehouseId,
        locationCode,
        notes,
        status: 'available',
      },
      include: {
        variant: { select: { id: true, sku: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: sn }, { status: 201 });
  } catch (error) {
    console.error('Error creating serial number:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
