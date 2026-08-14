import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Super Admin (env-driven, igual que el endpoint seed-admin) ───────
  // NO se crean cuentas con dominios de ejemplo: solo existe el super admin
  // definido por SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD (por defecto
  // anchillo00@gmail.com). El correo admin@adriskids.com fue eliminado por
  // no ser una cuenta real.
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'anchillo00@gmail.com').toLowerCase().trim();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Mineria99*';
  const adminPassword = await hash(superAdminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { role: 'super_admin', isActive: true, passwordHash: adminPassword },
    create: {
      email: superAdminEmail,
      passwordHash: adminPassword,
      fullName: 'Super Admin',
      role: 'super_admin',
    },
  });
  console.log(`Super Admin: ${superAdminEmail} (password desde SUPER_ADMIN_PASSWORD)`);

  // ─── Demo users ──────────────────────────────────────────────────────
  const demoPass = await hash('demo123', 12);
  for (const u of [
    { email: 'ventas@adriskids.com', fullName: 'Ventas Demo', role: 'sales_manager' as const },
    { email: 'almacen@adriskids.com', fullName: 'Almacen Demo', role: 'warehouse_manager' as const },
  ]) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, passwordHash: demoPass } });
  }
  console.log('Demo users created');

  // ─── Categories ──────────────────────────────────────────────────────
  const cats = [
    { name: 'Camas y Cunas', slug: 'camas-cunas', sortOrder: 1, description: 'Camas, cunas y berlines' },
    { name: 'Sillas Altas', slug: 'sillas-altas', sortOrder: 2, description: 'Sillas altas y coches' },
    { name: 'Carritos de Bebe', slug: 'carritos', sortOrder: 3, description: 'Cochecitos y movilidad' },
    { name: 'Decoracion', slug: 'decoracion', sortOrder: 4, description: 'Decoracion y accesorios' },
    { name: 'Banos y Higiene', slug: 'banos', sortOrder: 5, description: 'Tinas e higiene' },
    { name: 'Juguetes', slug: 'juguetes', sortOrder: 6, description: 'Juguetes y organizacion' },
  ];

  for (const c of cats) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  console.log('Categories seeded');

  // ─── Warehouse ───────────────────────────────────────────────────────
  await prisma.warehouse.upsert({
    where: { code: 'ALM-01' },
    update: {},
    create: { name: 'Almacen Principal', code: 'ALM-01' },
  });
  console.log('Warehouse seeded');

  // ─── Default Business (Page Builder) ─────────────────────────────────
  const business = await prisma.business.upsert({
    where: { slug: 'adriskids' },
    update: {},
    create: {
      name: 'AdriSu Kids',
      slug: 'adriskids',
      industry: 'ecommerce',
      primaryColor: '#2563eb',
      secondaryColor: '#7c3aed',
      accentColor: '#f59e0b',
      subdomain: 'adriskids',
      settings: JSON.stringify({
        currency: 'PEN',
        language: 'es',
        region: 'pe',
      }),
    },
  });
  console.log(`Business seeded: ${business.name} (${business.id})`);

  // ─── Default Tax Config (IGV Peru) ──────────────────────────────────
  await prisma.taxConfig.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'IGV (18%)',
      rate: 18,
      isDefault: true,
    },
  });
  console.log('Tax config seeded: IGV 18%');

  console.log('\nSeed completed!');
  console.log('Next steps:');
  console.log('  1. Run `pnpm --filter @repo/prisma db:push` to sync schema');
  console.log('  2. Run `pnpm --filter @repo/prisma db:seed` to seed data');
  console.log('  3. Run `pnpm --filter @repo/prisma tsx src/scripts/migrate-landings.ts` to migrate old landings');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
