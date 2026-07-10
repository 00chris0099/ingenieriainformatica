const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  try {
    const products = await p.product.findMany({
      select: { id: true, name: true, status: true, slug: true },
    });
    console.log('Products found:', products.length);
    products.forEach(p => console.log(`  - ${p.name} (${p.status}) slug: ${p.slug}`));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

check();
