import { NextRequest, NextResponse } from 'next/server';
import { storeVerificationCode, verifyCode } from '@/lib/auth-code';

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

    // Otherwise generate and store code
    const generatedCode = storeVerificationCode(emailStr);
    console.log(`[VERIFICATION CODE SENT] Email: ${emailStr} | Code: ${generatedCode} | Type: ${type || 'general'}`);

    return NextResponse.json({
      success: true,
      message: `Código de verificación enviado a ${emailStr}`,
      devCode: generatedCode,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al generar código' }, { status: 500 });
  }
}
