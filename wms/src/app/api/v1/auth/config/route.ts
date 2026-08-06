import { NextResponse } from 'next/server';

export async function GET() {
  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  return NextResponse.json({
    success: true,
    googleConfigured,
    resendConfigured,
    smtpConfigured,
  });
}
