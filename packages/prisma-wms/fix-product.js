const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function fix() {
  try {
    // Find the product
    const product = await p.product.findFirst({
      where: { slug: 'asiento-de-apoyo-para-bebe-vaquita' },
      include: { variants: true },
    });

    if (!product) {
      console.log('Product not found');
      return;
    }

    console.log('Product found:', product.name);
    console.log('Variants:', product.variants.length);

    // If no variants, create one with the price from discountPopup or a default
    if (product.variants.length === 0) {
      const defaultPrice = 89; // Default price
      const variant = await p.productVariant.create({
        data: {
          productId: product.id,
          sku: `${product.sku}-STD`,
          name: 'Estandar',
          price: defaultPrice,
          isActive: true,
          sortOrder: 0,
        },
      });
      console.log('Created variant with price:', defaultPrice);
    } else {
      console.log('Product already has variants');
    }

    // Verify
    const updated = await p.product.findUnique({
      where: { id: product.id },
      include: { variants: true },
    });
    console.log('Variants after fix:', updated.variants.length);
    updated.variants.forEach(v => console.log(`  - ${v.name}: S/ ${v.price}`));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

fix();
