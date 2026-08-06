import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { hash } from 'bcryptjs';
import { verifyCode } from '@/lib/auth-code';

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password, code, captchaAnswer, captchaExpected } = await request.json();

    if (!fullName || !email || !password || !code) {
      return NextResponse.json({ success: false, error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    // Validate Anti-bot Captcha
    if (captchaAnswer !== undefined && captchaExpected !== undefined) {
      if (Number(captchaAnswer) !== Number(captchaExpected)) {
        return NextResponse.json({ success: false, error: 'Respuesta Anti-bot incorrecta. Inténtalo de nuevo.' }, { status: 400 });
      }
    }

    const emailStr = email.toLowerCase().trim();

    // Validate email code
    const isCodeValid = verifyCode(emailStr, code);
    if (!isCodeValid) {
      return NextResponse.json({ success: false, error: 'El código de verificación del correo es incorrecto o ha expirado.' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailStr },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Este correo ya se encuentra registrado.' }, { status: 400 });
    }

    // Create new user ALWAYS with 'client' role
    const passwordHash = await hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: emailStr,
        passwordHash,
        fullName: fullName.trim(),
        role: 'client',
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registro exitoso. Bienvenido a la plataforma.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.fullName,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ success: false, error: 'Error al procesar el registro.' }, { status: 500 });
  }
}
