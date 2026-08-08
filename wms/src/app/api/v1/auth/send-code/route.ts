import { NextRequest, NextResponse } from 'next/server';
import { storeVerificationCode, verifyCode } from '@/lib/auth-code';
import { sendOtpEmail } from '@/lib/email';
import { compare, hash } from 'bcryptjs';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_BOOTSTRAP_PASSWORD } from '@/lib/super-admin';

let prismaClient: any = null;
async function getPrisma() {
  if (!prismaClient) {
    const { prisma } = await import('@repo/prisma');
    prismaClient = prisma;
  }
  return prismaClient;
}


export async function POST(request: NextRequest) {
  try {
    const { email, password, code, type, captchaAnswer, captchaExpected } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Correo electrónico no válido' }, { status: 400 });
    }

    const emailStr = email.toLowerCase().trim();

    // 1. If code is provided, verify OTP code
    if (code) {
      const isValid = verifyCode(emailStr, code);
      if (isValid) {
        return NextResponse.json({ success: true, message: 'Código verificado' });
      } else {
        return NextResponse.json({ success: false, error: 'Código de verificación incorrecto o expirado' }, { status: 400 });
      }
    }

    // 2. Validate Anti-bot Captcha
    if (captchaAnswer !== undefined && captchaExpected !== undefined) {
      if (Number(captchaAnswer) !== Number(captchaExpected)) {
        return NextResponse.json({ success: false, error: 'Respuesta Anti-bot incorrecta. Inténtalo de nuevo.' }, { status: 400 });
      }
    }

    // 3. PRE-VALIDATE CREDENTIALS (EMAIL & PASSWORD) BEFORE SENDING OTP CODE
    if (password) {
      const inputPass = (password as string).trim();
      let isValidUser = false;

      // Uniform validation for ALL users (including Super Admin). No hardcoded
      // passwords and no fail-safe: the account must exist in the DB with a
      // bcrypt hash (bootstrap via SUPER_ADMIN_PASSWORD env on first login).
      try {
        const prisma = await getPrisma();
        let user = await prisma.user.findUnique({ where: { email: emailStr } });

        if (!user && emailStr === SUPER_ADMIN_EMAIL && SUPER_ADMIN_BOOTSTRAP_PASSWORD) {
          user = await prisma.user.create({
            data: {
              email: SUPER_ADMIN_EMAIL,
              fullName: 'Super Admin',
              role: 'super_admin',
              passwordHash: await hash(SUPER_ADMIN_BOOTSTRAP_PASSWORD, 10),
              isActive: true,
            },
          });
        }

        if (user && user.isActive && user.passwordHash) {
          isValidUser = await compare(inputPass, user.passwordHash);
        }
      } catch (e) {
        console.warn('[USER AUTH DB WARNING]', e);
        isValidUser = false; // Never fall back to open verification
      }

      if (!isValidUser) {
        return NextResponse.json({ success: false, error: 'Correo o contraseña incorrectos.' }, { status: 401 });
      }
    }

    // 4. CREDENTIALS ARE VALID -> GENERATE AND SEND OTP EMAIL
    const generatedCode = storeVerificationCode(emailStr);
    const emailSent = await sendOtpEmail({
      to: emailStr,
      code: generatedCode,
      type: type || 'admin_login',
    });

    console.log(`[VERIFICATION CODE SENT TO EMAIL] Email: ${emailStr} | Code: ${generatedCode} | EmailSent: ${emailSent}`);

    return NextResponse.json({
      success: true,
      emailSent,
      message: `Se ha enviado un código de verificación de 6 dígitos a ${emailStr}`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al procesar la verificación' }, { status: 500 });
  }
}
