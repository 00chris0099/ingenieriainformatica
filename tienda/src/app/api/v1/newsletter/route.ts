import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';

/**
 * RF-40: Newsletter subscription API
 */

// POST - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, source } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({ data: existing, message: 'Already subscribed' });
      }
      // Reactivate
      const updated = await prisma.newsletterSubscriber.update({
        where: { email },
        data: { status: 'active' },
      });
      return NextResponse.json({ data: updated });
    }

    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email,
        name,
        source: source || 'footer',
      },
    });

    return NextResponse.json({ data: subscriber }, { status: 201 });
  } catch (error) {
    console.error('Error subscribing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - List subscribers (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: subscribers });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Unsubscribe
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { status: 'unsubscribed' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
