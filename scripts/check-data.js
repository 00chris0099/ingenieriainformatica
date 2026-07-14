const { PrismaClient } = require('../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const p = await prisma.product.findFirst({ where: { status: 'active' }, include: { variants: true } });
  if (p) {
    console.log('Product:', p.name);
    console.log('priceConfig:', JSON.stringify(p.priceConfig));
    const v = p.variants[0];
    if (v) {
      console.log('Variant[0] price:', v.price.toString(), 'compareAt:', v.compareAtPrice ? v.compareAtPrice.toString() : 'null');
    }
    const v1 = p.variants[1];
    if (v1) {
      console.log('Variant[1] price:', v1.price.toString(), 'compareAt:', v1.compareAtPrice ? v1.compareAtPrice.toString() : 'null');
    }
  }
  await prisma.$disconnect();
})();
