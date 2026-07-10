import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { auth } from '@/lib/auth';

/**
 * RF-27: API for abandoned checkout management
 */

// GET - List abandoned checkouts (WMS admin)
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

    const [checkouts, total] = await Promise.all([
      prisma.abandonedCheckout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.abandonedCheckout.count({ where }),
    ]);

    return NextResponse.json({ data: checkouts, total, limit, offset });
  } catch (error) {
    console.error('Error fetching abandoned checkouts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save abandoned checkout (from tienda)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, email, phone, name, items, subtotal, total, shippingAddress, paymentMethod } = body;

    const checkout = await prisma.abandonedCheckout.create({
      data: {
        sessionId,
        email,
        phone,
        name,
        items: items || [],
        subtotal: subtotal || 0,
        total: total || 0,
        shippingAddress: shippingAddress || {},
        paymentMethod,
        status: 'abandoned',
      },
    });

    return NextResponse.json({ data: checkout }, { status: 201 });
  } catch (error) {
    console.error('Error saving abandoned checkout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update status (mark as recovered/converted)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, orderId } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    const updateData: any = { status };
    if (status === 'recovered') updateData.recoveredAt = new Date();
    if (status === 'converted') {
      updateData.convertedAt = new Date();
      updateData.orderId = orderId;
    }

    const checkout = await prisma.abandonedCheckout.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: checkout });
  } catch (error) {
    console.error('Error updating abandoned checkout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
