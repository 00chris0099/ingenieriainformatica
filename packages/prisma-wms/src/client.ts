import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prismaWms: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prismaWms ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaWms = prisma;

export default prisma;
