import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding adriskids database...');

  // Admin user
  const adminPassword = await hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@adriskids.com' },
    update: {},
    create: {
      email: 'admin@adriskids.com',
      passwordHash: adminPassword,
      fullName: 'Administrador',
      role: 'super_admin',
    },
  });
  console.log('Admin: admin@adriskids.com / admin123');

  // Demo users
  const demoPass = await hash('demo123', 12);
  for (const u of [
    { email: 'ventas@adriskids.com', fullName: 'Ventas Demo', role: 'sales_manager' as const },
    { email: 'almacen@adriskids.com', fullName: 'Almacen Demo', role: 'warehouse_manager' as const },
  ]) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, passwordHash: demoPass } });
  }
  console.log('Demo users created');

  // Categories
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

  // Warehouse
  await prisma.warehouse.upsert({
    where: { code: 'ALM-01' },
    update: {},
    create: { name: 'Almacen Principal', code: 'ALM-01' },
  });
  console.log('Warehouse seeded');

  console.log('Seed completed! Create products through the WMS UI.');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
