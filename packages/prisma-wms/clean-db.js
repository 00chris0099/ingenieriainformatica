const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function clean() {
  try {
    // Delete in order of dependencies
    const tables = [
      'orderItem', 'order', 'inventory', 'pickListItem', 'returnItem',
      'cycleCountItem', 'qualityCheckItem', 'wishlist', 'review',
      'priceListItem', 'productVersion', 'lot', 'serialNumber',
      'productVariant', 'product'
    ];

    for (const table of tables) {
      try {
        if (p[table] && p[table].deleteMany) {
          await p[table].deleteMany();
        }
      } catch (e) {
        // Skip if table doesn't exist
      }
    }

    const count = await p.product.count();
    console.log('Products after clean:', count);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

clean();
