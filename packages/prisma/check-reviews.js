const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  try {
    const count = await p.review.count();
    console.log('Reviews count:', count);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

check();
