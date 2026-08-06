import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { auth } from '@/lib/auth';
import crypto from 'crypto';

/**
 * RF-68: Two-Factor Authentication API
 * Simple TOTP implementation for WMS admin
 */

// Generate a random secret
function generateSecret(): string {
  return crypto.randomBytes(20).toString('hex');
}

// Simple TOTP generation (6 digits, 30s window)
function generateTOTP(secret: string, epochOffset = 0): string {
  const epoch = Math.floor(Date.now() / 30000) + epochOffset;
  const hash = crypto.createHmac('sha1', secret).update(epoch.toString()).digest();
  const offset = (hash[hash.length - 1] ?? 0) & 0x0f;
  const b0 = hash[offset] ?? 0;
  const b1 = hash[offset + 1] ?? 0;
  const b2 = hash[offset + 2] ?? 0;
  const b3 = hash[offset + 3] ?? 0;
  const code = ((b0 & 0x7f) << 24) | ((b1 & 0xff) << 16) | ((b2 & 0xff) << 8) | (b3 & 0xff);
  return (code % 1000000).toString().padStart(6, '0');
}

// POST - Setup 2FA (generate secret)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'setup') {
      // Generate new secret
      const secret = generateSecret();

      // Store secret (not enabled yet)
      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorSecret: secret },
      });

      // Generate current code for verification
      const currentCode = generateTOTP(secret);

      return NextResponse.json({
        data: {
          secret,
          message: 'Scan the secret with your authenticator app',
        },
      });
    }

    if (action === 'verify') {
      const { code, secret } = body;

      if (!code || !secret) {
        return NextResponse.json({ error: 'code and secret required' }, { status: 400 });
      }

      // Verify the code
      const expectedCode = generateTOTP(secret);

      // Allow 1 window before and after (±30s)
      const prevCode = generateTOTP(secret, -1);
      const nextCode = generateTOTP(secret, 1);

      if (code === expectedCode || code === prevCode || code === nextCode) {
        // Enable 2FA
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            twoFactorSecret: secret,
            twoFactorEnabled: true,
          },
        });

        return NextResponse.json({ data: { enabled: true, message: '2FA enabled successfully' } });
      }

      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    if (action === 'disable') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorSecret: null,
          twoFactorEnabled: false,
        },
      });

      return NextResponse.json({ data: { disabled: true } });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('2FA error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Check 2FA status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    });

    return NextResponse.json({ data: { enabled: user?.twoFactorEnabled || false } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
