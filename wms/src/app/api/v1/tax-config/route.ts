import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { auth } from '@/lib/auth';

/**
 * RF-54: Tax configuration API
 */

export async function GET(request: NextRequest) {
  try {
    const taxes = await prisma.taxConfig.findMany({
      where: { isActive: true },
      orderBy: { isDefault: 'desc' },
    });
    return NextResponse.json({ data: taxes });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, rate, isDefault } = body;

    if (!name || rate === undefined) {
      return NextResponse.json({ error: 'name and rate required' }, { status: 400 });
    }

    // If setting as default, unset others
    if (isDefault) {
      await prisma.taxConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const tax = await prisma.taxConfig.create({
      data: { name, rate, isDefault: isDefault || false },
    });

    return NextResponse.json({ data: tax }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, name, rate, isDefault, isActive } = body;

    if (isDefault) {
      await prisma.taxConfig.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const tax = await prisma.taxConfig.update({
      where: { id },
      data: { name, rate, isDefault, isActive },
    });

    return NextResponse.json({ data: tax });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.taxConfig.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
