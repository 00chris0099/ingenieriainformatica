import { NextRequest } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, password } = body;
    if (!fullName || !email || !password) return apiError('Nombre, email y contrasena requeridos', 400);
    if (password.length < 8) return apiError('Minimo 8 caracteres', 400);
    const existing = await prisma.customer.findFirst({ where: { email } });
    if (existing) return apiError('Ya existe una cuenta con este email', 409);
    const passwordHash = await hash(password, 12);
    const customer = await prisma.customer.create({
      data: { email, fullName, password: passwordHash },
    });
    return apiSuccess({ id: customer.id, email: customer.email }, 201);
  } catch (error) { return handleApiError(error, 'register'); }
}
