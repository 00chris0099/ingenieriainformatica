import { NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { hash } from 'bcryptjs';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_BOOTSTRAP_PASSWORD } from '@/lib/super-admin';

export async function GET() {
  // Enterprise-safe: the bootstrap password must come from the environment (EasyPanel).
  if (!SUPER_ADMIN_BOOTSTRAP_PASSWORD) {
    return NextResponse.json(
      {
        success: false,
        error: 'SUPER_ADMIN_PASSWORD no configurada en el entorno. Configúrala en EasyPanel y vuelve a intentarlo.',
      },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hash(SUPER_ADMIN_BOOTSTRAP_PASSWORD, 10);

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
