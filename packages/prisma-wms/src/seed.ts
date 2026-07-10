import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding WMS database...');

  // Create admin user
  const adminPassword = await hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@adriskids.com' },
    update: {},
    create: {
      email: 'admin@adriskids.com',
      passwordHash: adminPassword,
      fullName: 'Administrador',
      role: 'super_admin',
      isActive: true,
    },
  });
  console.log('Admin user created: admin@adriskids.com / admin123');

  // Create demo users
  const demoPassword = await hash('demo123', 12);
  const demoUsers = [
    { email: 'ventas@adriskids.com', fullName: 'Ventas Demo', role: 'sales_manager' as const },
    { email: 'almacen@adriskids.com', fullName: 'Almacen Demo', role: 'warehouse_manager' as const },
    { email: 'contabilidad@adriskids.com', fullName: 'Contabilidad Demo', role: 'finance' as const },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        passwordHash: demoPassword,
        isActive: true,
      },
    });
  }
  console.log('Demo users created');

  // Create categories
  const categories = [
    { name: 'Camas y Cunas', slug: 'camas-cunas', sortOrder: 1, description: 'Camas, cunas y berlines para recien nacidos' },
    { name: 'Sillas Altas', slug: 'sillas-altas', sortOrder: 2, description: 'Sillas altas y coches para comer' },
    { name: 'Carritos de Bebe', slug: 'carritos', sortOrder: 3, description: 'Cochecitos, sillas de auto y movilidad' },
    { name: 'Decoracion', slug: 'decoracion', sortOrder: 4, description: 'Decoracion y accesorios para el cuarto' },
    { name: 'Banos y Higiene', slug: 'banos', sortOrder: 5, description: 'Tinas, escaleras e higiene' },
    { name: 'Juguetes', slug: 'juguetes', sortOrder: 6, description: 'Juguetes educativos y organizacion' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('Categories seeded');

  // Create warehouses
  await prisma.warehouse.upsert({
    where: { code: 'ALM-01' },
    update: {},
    create: { name: 'Almacen Principal', code: 'ALM-01', description: 'Almacen central' },
  });
  console.log('Warehouses seeded');

  // Create suppliers
  const suppliers = [
    { name: 'Proveedor Local', code: 'SUP-001', supplierType: 'local', country: 'Peru', rating: 5 },
    { name: 'Proveedor Internacional', code: 'SUP-002', supplierType: 'international', country: 'China', rating: 4 },
  ];

  for (const sup of suppliers) {
    await prisma.supplier.upsert({
      where: { code: sup.code },
      update: {},
      create: sup,
    });
  }
  console.log('Suppliers seeded');

  console.log('Seed completed! Products can be created through the WMS UI.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
