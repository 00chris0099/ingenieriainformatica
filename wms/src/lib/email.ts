import nodemailer from 'nodemailer';

interface SendOtpEmailOptions {
  to: string;
  code: string;
  type: 'admin_login' | 'register' | 'recovery';
}

export async function sendOtpEmail({ to, code, type }: SendOtpEmailOptions): Promise<boolean> {
  const titles = {
    admin_login: 'Código de Seguridad - Acceso Super Admin',
    register: 'Código de Verificación - Registro de Tienda Virtual',
    recovery: 'Código de Restablecimiento de Contraseña',
  };

  const subject = titles[type] || 'Código de Verificación de Seguridad';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background-color: #090d16; color: #ffffff; border-radius: 20px; border: 1px solid #1f2937;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #ef4444; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">E-STORE PLATFORM</h1>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 4px; font-weight: 600; text-transform: uppercase;">Seguridad de la Plataforma</p>
      </div>

      <div style="background-color: #111827; padding: 22px; border-radius: 14px; border: 1px solid #374151; margin-bottom: 25px;">
        <h2 style="font-size: 16px; margin: 0 0 10px 0; color: #f3f4f6;">${subject}</h2>
        <p style="font-size: 13px; color: #9ca3af; margin: 0 0 15px 0;">Tu código único de verificación es:</p>

        <div style="background-color: #000000; border: 2px solid #ef4444; border-radius: 12px; padding: 16px; text-align: center;">
          <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #ef4444;">${code}</span>
        </div>

        <p style="font-size: 11px; color: #6b7280; margin-top: 15px; margin-bottom: 0;">Este código vence en 5 minutos. Si no solicitaste este acceso, ignora este mensaje.</p>
      </div>

      <div style="text-align: center; border-top: 1px solid #1f2937; padding-top: 15px;">
        <p style="font-size: 11px; color: #6b7280; margin: 0;">© 2026 E-Store Platform — Sistema de Tiendas Virtuales</p>
      </div>
    </div>
  `;

  // 1. ENGINE 1: Gmail SMTP via Nodemailer (Primary for pedroanchillo185@gmail.com)
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER || 'pedroanchillo185@gmail.com';
  const smtpPass = process.env.SMTP_PASS || 'gnuu gvub taup awno';
  const emailFrom = process.env.EMAIL_FROM || `Plataforma de Tiendas <${smtpUser}>`;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const info = await transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`[GMAIL SMTP EMAIL SUCCESS] Sent to ${to} | MessageId: ${info.messageId}`);
      return true;
    } catch (smtpErr) {
      console.error('[GMAIL SMTP EMAIL FAILED]', smtpErr);
    }
  }

  // 2. ENGINE 2: Resend HTTP API Fallback
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: [to],
          subject,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        console.log(`[RESEND API SUCCESS] Email sent to ${to}`);
        return true;
      }
    } catch (resendErr) {
      console.error('[RESEND API FAILED]', resendErr);
    }
  }

  console.log(`[EMAIL DISPATCHER FAILED] Could not send email to ${to}. Code was: ${code}`);
  return false;
}
