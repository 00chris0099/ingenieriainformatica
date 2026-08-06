import { NextRequest, NextResponse } from 'next/server';

// In-memory verification codes store (5 min expiry)
const codesStore = new Map<string, { code: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Correo electrónico no válido' }, { status: 400 });
    }

    const emailStr = email.toLowerCase().trim();
    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    codesStore.set(emailStr, { code, expiresAt });

    console.log(`[VERIFICATION CODE SENT] Email: ${emailStr} | Code: ${code} | Type: ${type || 'general'}`);

    return NextResponse.json({
      success: true,
      message: `Código de verificación enviado a ${emailStr}`,
      // Return code in dev/demo mode so user can see it immediately
      devCode: code,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al generar código' }, { status: 500 });
  }
}

export function verifyCode(email: string, inputCode: string): boolean {
  const emailStr = email.toLowerCase().trim();
  const stored = codesStore.get(emailStr);
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    codesStore.delete(emailStr);
    return false;
  }
  const match = stored.code === inputCode.trim();
  if (match) codesStore.delete(emailStr);
  return match;
}
