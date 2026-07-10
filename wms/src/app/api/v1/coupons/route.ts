import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { auth } from '@/lib/auth';

/**
 * RF-34: Coupons API
 */

// GET - List coupons (admin) or validate coupon (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    // Public: validate coupon
    if (code) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon || !coupon.isActive) {
        return NextResponse.json({ error: 'Invalid coupon' }, { status: 404 });
      }

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
      }

      return NextResponse.json({
        data: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: Number(coupon.discountValue),
          minPurchase: Number(coupon.minPurchase),
          maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
        },
      });
    }

    // Admin: list all coupons
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: coupons });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create coupon (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, description, discountType, discountValue, minPurchase, maxDiscount, usageLimit, validFrom, validUntil } = body;

    if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        minPurchase: minPurchase || 0,
        maxDiscount,
        usageLimit,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
      },
    });

    return NextResponse.json({ data: coupon }, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update coupon usage (when applied)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: { usedCount: { increment: 1 } },
    });

    return NextResponse.json({ data: coupon });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete coupon (admin)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
