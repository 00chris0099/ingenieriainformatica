import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { hash } from 'bcryptjs';
import { verifyCode } from '../send-code/route';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, code, captchaAnswer, captchaExpected } = await request.json();

    if (!email || !newPassword || !code) {
      return NextResponse.json({ success: false, error: 'Correo, código y nueva contraseña requeridos.' }, { status: 400 });
    }

    // Validate Anti-bot Captcha
    if (captchaAnswer !== undefined && captchaExpected !== undefined) {
      if (Number(captchaAnswer) !== Number(captchaExpected)) {
        return NextResponse.json({ success: false, error: 'Respuesta Anti-bot incorrecta.' }, { status: 400 });
      }
    }

    const emailStr = email.toLowerCase().trim();

    // Verify OTP code
    const isCodeValid = verifyCode(emailStr, code);
    if (!isCodeValid) {
      return NextResponse.json({ success: false, error: 'Código de verificación incorrecto o expirado.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: emailStr },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'No se encontró una cuenta asociada a este correo.' }, { status: 404 });
    }

    const passwordHash = await hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente. Ahora puedes iniciar sesión.',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al restablecer contraseña.' }, { status: 500 });
  }
}
