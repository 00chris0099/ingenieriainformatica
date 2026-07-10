import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const returnRecord = await prisma.return.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            variant: { select: { id: true, sku: true, name: true } },
          },
        },
      },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    return NextResponse.json({ data: returnRecord });
  } catch (error) {
    console.error('Error fetching return:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes, items } = body;

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'inspecting') updateData.receivedAt = new Date();
      if (status === 'reconditioned' || status === 'damaged' || status === 'disposed') {
        updateData.inspectedAt = new Date();
        updateData.resolvedAt = new Date();
      }
    }
    if (notes !== undefined) updateData.notes = notes;

    // Update items if provided
    if (items?.length) {
      for (const item of items) {
        await prisma.returnItem.update({
          where: { id: item.id },
          data: {
            condition: item.condition,
            disposition: item.disposition,
            notes: item.notes,
          },
        });
      }
    }

    const returnRecord = await prisma.return.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: { select: { id: true, fullName: true } },
        warehouse: { select: { id: true, name: true } },
        items: true,
      },
    });

    return NextResponse.json({ data: returnRecord });
  } catch (error) {
    console.error('Error updating return:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.return.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting return:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
