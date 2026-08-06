import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    googleConfigured: true,
    resendConfigured: true,
    smtpConfigured: true,
  });
}
