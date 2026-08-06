import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { generateResetToken } from '@/lib/reset-tokens';
import { sendOtpEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Correo electrónico no válido' }, { status: 400 });
    }

    const emailStr = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: emailStr },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'No se encontró una cuenta registrada con este correo.' }, { status: 404 });
    }

    // Generate temporary link
    const token = generateResetToken(emailStr);
    const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'aimachristian-tiendawms.ajcxjb.easypanel.host';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const resetUrl = `${protocol}://${hostHeader}/reset-password?token=${token}&email=${encodeURIComponent(emailStr)}`;

    // Dispatch email
    const emailSent = await sendOtpEmail({
      to: emailStr,
      code: token.substring(0, 6).toUpperCase(),
      type: 'recovery',
    });

    console.log(`[RESET PASSWORD LINK GENERATED] Email: ${emailStr} | Link: ${resetUrl}`);

    return NextResponse.json({
      success: true,
      emailSent,
      resetUrl,
      message: `Enlace temporal de recuperación enviado a ${emailStr}`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al generar enlace de recuperación' }, { status: 500 });
  }
}
