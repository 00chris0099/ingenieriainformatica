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

    const pickList = await prisma.pickList.findUnique({
      where: { id: params.id },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        assignee: { select: { id: true, fullName: true } },
        items: {
          include: {
            variant: { select: { id: true, sku: true, name: true } },
          },
        },
      },
    });

    if (!pickList) {
      return NextResponse.json({ error: 'Pick list not found' }, { status: 404 });
    }

    return NextResponse.json({ data: pickList });
  } catch (error) {
    console.error('Error fetching pick list:', error);
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
    const { status, assignedTo, notes, items } = body;

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'in_progress') updateData.startedAt = new Date();
      if (status === 'completed') updateData.completedAt = new Date();
    }
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (notes !== undefined) updateData.notes = notes;

    // Update items if provided
    if (items?.length) {
      for (const item of items) {
        await prisma.pickListItem.update({
          where: { id: item.id },
          data: {
            scannedQty: item.scannedQty,
            status: item.status,
            locationCode: item.locationCode,
            scannedAt: item.status === 'picked' ? new Date() : undefined,
          },
        });
      }
    }

    const pickList = await prisma.pickList.update({
      where: { id: params.id },
      data: updateData,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        assignee: { select: { id: true, fullName: true } },
        items: true,
      },
    });

    return NextResponse.json({ data: pickList });
  } catch (error) {
    console.error('Error updating pick list:', error);
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

    await prisma.pickList.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pick list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
