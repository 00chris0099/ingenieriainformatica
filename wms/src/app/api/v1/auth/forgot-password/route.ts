import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { hash } from 'bcryptjs';
import { verifyResetToken, consumeResetToken } from '@/lib/reset-tokens';

export async function POST(request: NextRequest) {
  try {
    const { token, email, newPassword, captchaAnswer, captchaExpected } = await request.json();

    if (!newPassword || (!token && !email)) {
      return NextResponse.json({ success: false, error: 'Datos incompletos.' }, { status: 400 });
    }

    // Anti-bot check
    if (captchaAnswer !== undefined && captchaExpected !== undefined) {
      if (Number(captchaAnswer) !== Number(captchaExpected)) {
        return NextResponse.json({ success: false, error: 'Respuesta Anti-bot incorrecta.' }, { status: 400 });
      }
    }

    let targetEmail = email ? email.toLowerCase().trim() : '';

    // Verify token if provided
    if (token) {
      const verification = verifyResetToken(token);
      if (!verification.valid || !verification.email) {
        return NextResponse.json({ success: false, error: 'El enlace de recuperación es inválido o ha expirado.' }, { status: 400 });
      }
      targetEmail = verification.email;
      consumeResetToken(token);
    }

    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'No se encontró una cuenta para este correo.' }, { status: 404 });
    }

    const passwordHash = await hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al actualizar la contraseña.' }, { status: 500 });
  }
}
