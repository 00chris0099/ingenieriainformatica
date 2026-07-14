const { PrismaClient } = require('../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client');
const prisma = new PrismaClient();

(async () => {
  // Fix product variants with inverted prices
  // compareAtPrice should be HIGHER than price (original vs discounted)
  const variants = await prisma.productVariant.findMany();
  for (const v of variants) {
    const price = Number(v.price);
    const compare = v.compareAtPrice ? Number(v.compareAtPrice) : null;
    
    // If compareAtPrice exists but is equal to price, remove it (no discount)
    if (compare && compare === price) {
      console.log('FIXING variant (equal):', v.name, 'removing compareAtPrice');
      await prisma.productVariant.update({
        where: { id: v.id },
        data: { compareAtPrice: null }
      });
    }
    // If compareAtPrice exists but is less than price, it's inverted - swap them
    else if (compare && compare < price) {
      console.log('FIXING variant (inverted):', v.name, 'price:', price, 'compareAt:', compare, '-> swapping');
      await prisma.productVariant.update({
        where: { id: v.id },
        data: { price: compare, compareAtPrice: price }
      });
    }
  }

  // Fix suggested products with inverted prices
  const suggested = await prisma.suggestedProduct.findMany();
  for (const s of suggested) {
    const price = Number(s.price);
    const compare = s.compareAtPrice ? Number(s.compareAtPrice) : null;
    
    if (compare && compare === price) {
      console.log('FIXING suggested (equal):', s.name, 'removing compareAtPrice');
      await prisma.suggestedProduct.update({
        where: { id: s.id },
        data: { compareAtPrice: null }
      });
    } else if (compare && compare < price) {
      console.log('FIXING suggested (inverted):', s.name, 'price:', price, 'compareAt:', compare, '-> swapping');
      await prisma.suggestedProduct.update({
        where: { id: s.id },
        data: { price: compare, compareAtPrice: price }
      });
    }
  }

  await prisma.$disconnect();
  console.log('Done');
})();
