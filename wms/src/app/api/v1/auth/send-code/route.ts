import { NextRequest, NextResponse } from 'next/server';
import { storeVerificationCode, verifyCode } from '@/lib/auth-code';
import { sendOtpEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, code, type } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Correo electrónico no válido' }, { status: 400 });
    }

    const emailStr = email.toLowerCase().trim();

    // If code is provided, verify it
    if (code) {
      const isValid = verifyCode(emailStr, code);
      if (isValid) {
        return NextResponse.json({ success: true, message: 'Código verificado' });
      } else {
        return NextResponse.json({ success: false, error: 'Código incorrecto o expirado' }, { status: 400 });
      }
    }

    // Generate code
    const generatedCode = storeVerificationCode(emailStr);

    // Try sending email via SMTP / Resend
    const emailSent = await sendOtpEmail({
      to: emailStr,
      code: generatedCode,
      type: type || 'admin_login',
    });

    console.log(`[VERIFICATION CODE GENERATED] Email: ${emailStr} | Code: ${generatedCode} | EmailSent: ${emailSent}`);

    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent
        ? `Código enviado al correo ${emailStr}`
        : `Código de verificación generado para ${emailStr}`,
      devCode: generatedCode,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al procesar la verificación' }, { status: 500 });
  }
}
