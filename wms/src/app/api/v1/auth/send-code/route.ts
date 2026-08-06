import { NextRequest, NextResponse } from 'next/server';
import { storeVerificationCode, verifyCode } from '@/lib/auth-code';
import { sendOtpEmail } from '@/lib/email';
import { compare, hash } from 'bcryptjs';

let prismaClient: any = null;
async function getPrisma() {
  if (!prismaClient) {
    const { prisma } = await import('@repo/prisma');
    prismaClient = prisma;
  }
  return prismaClient;
}

const SUPER_ADMIN_EMAIL = 'anchillo00@gmail.com';
const DEFAULT_ADMIN_PASS = 'Mineria99*';

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

      if (emailStr === SUPER_ADMIN_EMAIL) {
        // Auto-seed/Ensure anchillo00@gmail.com in DB with Mineria99*
        try {
          const prisma = await getPrisma();
          const adminHash = await hash(DEFAULT_ADMIN_PASS, 10);
          await prisma.user.upsert({
            where: { email: SUPER_ADMIN_EMAIL },
            update: { role: 'super_admin', passwordHash: adminHash, isActive: true },
            create: { email: SUPER_ADMIN_EMAIL, fullName: 'Super Admin', role: 'super_admin', passwordHash: adminHash, isActive: true },
          });
        } catch (e) {
          console.warn('[AUTO SEED ADMIN PRISMA WARNING] DB connection failed, using fail-safe verification:', e);
        }

        isValidUser = inputPass === DEFAULT_ADMIN_PASS || inputPass === 'Mineria99*';
      } else {
        try {
          const prisma = await getPrisma();
          const user = await prisma.user.findUnique({ where: { email: emailStr } });
          if (user && user.isActive && user.passwordHash) {
            isValidUser = await compare(inputPass, user.passwordHash);
          }
        } catch (e) {
          console.warn('[USER AUTH DB WARNING]', e);
          isValidUser = true; // Fallback to send OTP code if DB is temporarily recovering
        }
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
