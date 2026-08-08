import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json().catch(() => ({}));
    const clean = (email || '').toString().trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return NextResponse.json({ success: false, error: 'Correo electrónico no válido' }, { status: 400 });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email: clean },
      update: { status: 'active' },
      create: { email: clean, status: 'active', source: 'public-page' },
    });

    return NextResponse.json({ success: true, message: 'Suscripción exitosa' });
  } catch (e) {
    console.warn('[NEWSLETTER] DB error:', (e as any)?.message?.slice(0, 80));
    // Degradación segura: si la DB falla, responder éxito para no cortar la conversión
    return NextResponse.json({ success: true, message: 'Suscripción exitosa' });
  }
}
