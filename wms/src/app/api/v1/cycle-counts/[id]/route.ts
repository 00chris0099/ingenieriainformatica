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

    const cycleCount = await prisma.cycleCount.findUnique({
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

    if (!cycleCount) {
      return NextResponse.json({ error: 'Cycle count not found' }, { status: 404 });
    }

    return NextResponse.json({ data: cycleCount });
  } catch (error) {
    console.error('Error fetching cycle count:', error);
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
        const variance = item.countedQty - item.expectedQty;
        await prisma.cycleCountItem.update({
          where: { id: item.id },
          data: {
            countedQty: item.countedQty,
            variance,
            status: 'counted',
            countedAt: new Date(),
          },
        });

        // Auto-adjust inventory if variance exists
        if (variance !== 0) {
          await prisma.inventory.updateMany({
            where: {
              variantId: item.variantId,
              warehouseId: item.warehouseId,
            },
            data: {
              quantity: item.countedQty,
              availableQuantity: item.countedQty,
            },
          });

          await prisma.cycleCountItem.update({
            where: { id: item.id },
            data: { status: 'adjusted', adjustedAt: new Date() },
          });
        }
      }
    }

    const cycleCount = await prisma.cycleCount.update({
      where: { id: params.id },
      data: updateData,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        assignee: { select: { id: true, fullName: true } },
        items: true,
      },
    });

    return NextResponse.json({ data: cycleCount });
  } catch (error) {
    console.error('Error updating cycle count:', error);
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

    await prisma.cycleCount.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cycle count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
