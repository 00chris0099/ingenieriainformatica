const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  try {
    const product = await p.product.findUnique({
      where: { slug: 'asiento-de-apoyo-para-bebe-vaquita' },
      select: {
        images: true,
        height: true,
        width: true,
        depth: true,
        color: true,
        materials: true,
        warrantyDays: true,
        variants: { select: { price: true, images: true } },
      },
    });
    console.log('Product details:', JSON.stringify(product, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

check();
