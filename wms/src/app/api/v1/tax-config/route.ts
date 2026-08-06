import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-guard';

export async function GET() {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

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
    const authCheck = await requireRole('super_admin', 'admin');
    if (authCheck.error) return authCheck.error;

    const body = await request.json();
    const { name, rate, isDefault } = body;

    if (!name || rate === undefined) {
      return NextResponse.json({ error: 'name and rate required' }, { status: 400 });
    }

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
    const authCheck = await requireRole('super_admin', 'admin');
    if (authCheck.error) return authCheck.error;

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
    const authCheck = await requireRole('super_admin', 'admin');
    if (authCheck.error) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.taxConfig.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
