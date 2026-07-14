const { PrismaClient } = require('../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const variants = await prisma.productVariant.findMany();
  for (const v of variants) {
    console.log(v.name, '| price:', v.price.toString(), '| compareAt:', v.compareAtPrice ? v.compareAtPrice.toString() : 'null');
  }
  const suggested = await prisma.suggestedProduct.findMany();
  for (const s of suggested) {
    console.log('[Suggested]', s.name, '| price:', s.price.toString(), '| compareAt:', s.compareAtPrice ? s.compareAtPrice.toString() : 'null');
  }
  await prisma.$disconnect();
})();
