import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  generateProductLabel,
  generateProductLabelLarge,
  generateShippingLabel,
  generateShippingLabelLarge,
  LABEL_CONFIGS,
} from '@/lib/printing/zpl';

/**
 * POST - Generate ZPL label
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, size, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'type and data are required' }, { status: 400 });
    }

    let zpl: string;

    switch (type) {
      case 'product':
        zpl = size === 'large'
          ? generateProductLabelLarge(data)
          : generateProductLabel(data);
        break;

      case 'shipping':
        zpl = size === 'large'
          ? generateShippingLabelLarge(data)
          : generateShippingLabel(data);
        break;

      default:
        return NextResponse.json({ error: 'Invalid label type' }, { status: 400 });
    }

    return NextResponse.json({
      data: {
        zpl,
        type,
        size: size || 'small',
        config: size === 'large'
          ? (type === 'product' ? LABEL_CONFIGS.product_large : LABEL_CONFIGS.shipping_large)
          : (type === 'product' ? LABEL_CONFIGS.product_small : LABEL_CONFIGS.shipping),
      },
    });
  } catch (error) {
    console.error('Error generating label:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET - Get label configurations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      data: {
        configs: LABEL_CONFIGS,
        types: ['product', 'shipping'],
        sizes: ['small', 'large'],
      },
    });
  } catch (error) {
    console.error('Error fetching label configs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
