import { NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { hash } from 'bcryptjs';

const SUPER_ADMIN_EMAIL = 'anchillo00@gmail.com';
const DEFAULT_ADMIN_PASS = 'Mineria99*';

export async function GET() {
  try {
    const passwordHash = await hash(DEFAULT_ADMIN_PASS, 10);

    const user = await prisma.user.upsert({
      where: { email: SUPER_ADMIN_EMAIL },
      update: {
        fullName: 'Super Admin',
        role: 'super_admin',
        passwordHash,
        isActive: true,
      },
      create: {
        email: SUPER_ADMIN_EMAIL,
        fullName: 'Super Admin',
        role: 'super_admin',
        passwordHash,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Usuario Super Admin (${SUPER_ADMIN_EMAIL}) creado/actualizado correctamente en PostgreSQL.`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error('[SEED ADMIN ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Error al sembrar admin' }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
