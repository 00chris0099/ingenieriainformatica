import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, string> = {};

  // Check PostgreSQL
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    checks.postgresql = 'ok';
    await prisma.$disconnect();
  } catch {
    checks.postgresql = 'error';
  }

  // Check Redis
  try {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    await redis.ping();
    checks.redis = 'ok';
    await redis.disconnect();
  } catch {
    checks.redis = 'error';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  }, { status: allOk ? 200 : 503 });
}
