import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { auth } from '@/lib/auth';

/**
 * RF-30: Wishlist API
 */

// GET - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: [] });
    }

    const wishlists = await prisma.wishlist.findMany({
      where: { customerId: session.user.id },
      include: {
        product: { select: { id: true, name: true, slug: true, images: true, price: true, compareAtPrice: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: wishlists });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add to wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        customerId_productId: {
          customerId: session.user.id,
          productId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ data: existing, message: 'Already in wishlist' });
    }

    const wishlist = await prisma.wishlist.create({
      data: {
        customerId: session.user.id,
        productId,
      },
    });

    return NextResponse.json({ data: wishlist }, { status: 201 });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    await prisma.wishlist.deleteMany({
      where: {
        customerId: session.user.id,
        productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
