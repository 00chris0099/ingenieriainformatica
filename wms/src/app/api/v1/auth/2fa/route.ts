import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { auth } from '@/lib/auth';
import { generateBase32Secret, verifyTotp, otpauthUri } from '@/lib/totp';

/**
 * Two-Factor Authentication (TOTP — RFC 6238).
 * Secreto Base32 compatible con Google Authenticator, Authy, 1Password…
 * El secreto se guarda en el usuario y el login (lib/auth.ts) exige el código
 * del autenticador en el servidor cuando twoFactorEnabled es true.
 */

// POST — setup / verify / disable
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body || {};

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    if (action === 'setup') {
      // Generar secreto Base32 nuevo (aún NO activado)
      const secret = generateBase32Secret();
      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorSecret: secret, twoFactorEnabled: false },
      });

      return NextResponse.json({
        data: {
          secret,
          otpauthUrl: otpauthUri(secret, user.email),
          digits: 6,
          period: 30,
        },
      });
    }

    if (action === 'verify') {
      // Confirmar el secreto con un código del autenticador y activar 2FA
      const code = String(body?.code || '').trim();
      if (!code) return NextResponse.json({ error: 'Ingresa el código de 6 dígitos' }, { status: 400 });
      if (!user.twoFactorSecret) return NextResponse.json({ error: 'Primero genera un secreto (setup)' }, { status: 400 });
      if (!verifyTotp(user.twoFactorSecret, code)) {
        return NextResponse.json({ error: 'Código incorrecto. Verifica la hora de tu dispositivo.' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: true },
      });
      return NextResponse.json({ data: { enabled: true, message: '2FA activado correctamente' } });
    }

    if (action === 'disable') {
      // Desactivar requiere el código actual (evita desactivación por robo de sesión)
      const code = String(body?.code || '').trim();
      if (!user.twoFactorSecret) {
        await prisma.user.update({ where: { id: session.user.id }, data: { twoFactorSecret: null, twoFactorEnabled: false } });
        return NextResponse.json({ data: { disabled: true } });
      }
      if (!code) return NextResponse.json({ error: 'Ingresa tu código actual del autenticador' }, { status: 400 });
      if (!verifyTotp(user.twoFactorSecret, code)) {
        return NextResponse.json({ error: 'Código incorrecto' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorSecret: null, twoFactorEnabled: false },
      });
      return NextResponse.json({ data: { disabled: true, message: '2FA desactivado' } });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('2FA error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// GET — estado de 2FA del usuario autenticado
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true, email: true },
    });

    return NextResponse.json({ data: { enabled: user?.twoFactorEnabled || false } });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
