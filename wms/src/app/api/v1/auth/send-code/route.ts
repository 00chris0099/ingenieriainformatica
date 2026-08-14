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
    let validUser: any = null;
    if (password) {
      const inputPass = (password as string).trim();
      let isValidUser = false;

      // Uniform validation for ALL users (including Super Admin). No hardcoded
      // passwords and no fail-safe: the account must exist in the DB with a
      // bcrypt hash (bootstrap via SUPER_ADMIN_PASSWORD env on first login).
      try {
        const prisma = await getPrisma();
        let user = await prisma.user.findUnique({ where: { email: emailStr } });

        // Bootstrap auto-curativo del Super Admin (fuente de verdad: el entorno).
        // Si SUPER_ADMIN_EMAIL coincide y SUPER_ADMIN_PASSWORD está configurada,
        // el usuario se crea o actualiza con el hash de esa contraseña, de modo
        // que el login funciona aunque la BD de producción quedara sin el usuario
        // o con un hash antiguo (p. ej. tras desplegar sin correr el seed).
        if (emailStr === SUPER_ADMIN_EMAIL && SUPER_ADMIN_BOOTSTRAP_PASSWORD) {
          const adminHash = await hash(SUPER_ADMIN_BOOTSTRAP_PASSWORD, 10);
          user = await prisma.user.upsert({
            where: { email: SUPER_ADMIN_EMAIL },
            update: {
              fullName: 'Super Admin',
              role: 'super_admin',
              passwordHash: adminHash,
              isActive: true,
            },
            create: {
              email: SUPER_ADMIN_EMAIL,
              fullName: 'Super Admin',
              role: 'super_admin',
              passwordHash: adminHash,
              isActive: true,
            },
          });
        }

        if (user && user.isActive && user.passwordHash) {
          isValidUser = await compare(inputPass, user.passwordHash);
          validUser = user;
        }
      } catch (e) {
        console.warn('[USER AUTH DB WARNING]', e);
        isValidUser = false; // Never fall back to open verification
      }

      if (!isValidUser) {
        return NextResponse.json({ success: false, error: 'Correo o contraseña incorrectos.' }, { status: 401 });
      }

      // 3b. 2FA TOTP: la cuenta exige el código del autenticador (no un OTP por email)
      if (validUser?.twoFactorEnabled) {
        return NextResponse.json({
          success: true,
          twoFactorRequired: true,
          message: 'Tu cuenta tiene verificación en dos pasos (autenticador). Ingresa el código de 6 dígitos de tu app.',
        });
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

    // Dev-mode fallback: si el correo no se pudo entregar (p. ej. Resend en
    // sandbox solo envía a la cuenta del owner), el código se devuelve en la
    // respuesta para que el login sea usable en desarrollo/localhost.
    // NUNCA se expone en producción.
    const isDev =
      process.env.NODE_ENV !== 'production' &&
      (process.env.ALLOW_DEV_OTP_FALLBACK === 'true' || process.env.NODE_ENV === 'development');

    if (!emailSent && isDev) {
      return NextResponse.json({
        success: true,
        emailSent: false,
        devCode: generatedCode,
        message: `[MODO DESARROLLO] Email no entregado (${emailStr}); usa el código ${generatedCode} para ingresar.`,
      });
    }

    if (!emailSent) {
      return NextResponse.json({
        success: true,
        emailSent: false,
        message: `No se pudo enviar el correo a ${emailStr}. Verifica SMTP_HOST/SMTP_USER/SMTP_PASS o RESEND_API_KEY (Resend requiere verificar un dominio).`,
      });
    }

    return NextResponse.json({
      success: true,
      emailSent,
      message: `Se ha enviado un código de verificación de 6 dígitos a ${emailStr}`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al procesar la verificación' }, { status: 500 });
  }
}
