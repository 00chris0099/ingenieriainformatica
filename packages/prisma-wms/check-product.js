const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  try {
    const product = await p.product.findUnique({
      where: { slug: 'asiento-de-apoyo-para-bebe-vaquita' },
      select: { id: true, name: true, status: true, slug: true, images: true },
    });
    console.log('Product:', JSON.stringify(product, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

check();
