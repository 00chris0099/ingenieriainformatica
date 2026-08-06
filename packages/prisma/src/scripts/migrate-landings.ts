/**
 * Migrate old filesystem-based landing pages (JSON) to the Page Builder database.
 *
 * Usage:
 *   pnpm --filter @repo/prisma tsx src/scripts/migrate-landings.ts
 *
 * Reads JSON files from public/landings/ (if they exist) and creates Page records
 * in the database linked to the default business.
 */
import { PrismaClient } from '@prisma/client';
import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const LANDINGS_DIR = path.join(process.cwd(), '..', '..', 'wms', 'public', 'landings');

interface LandingData {
  blocks?: Array<{
    id: string;
    type: string;
    content: Record<string, any>;
  }>;
  updatedAt?: string;
}

async function main() {
  console.log('Migrating landing pages to Page Builder...\n');

  // Find the default business
  const business = await prisma.business.findFirst({
    where: { slug: 'adriskids' },
  });

  if (!business) {
    console.error('No business found. Run seed first: pnpm --filter @repo/prisma db:seed');
    process.exit(1);
  }

  console.log(`Using business: ${business.name} (${business.id})`);

  // Check if landings directory exists
  if (!existsSync(LANDINGS_DIR)) {
    console.log(`No landings directory found at ${LANDINGS_DIR}`);
    console.log('Nothing to migrate.');
    return;
  }

  const files = await readdir(LANDINGS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  if (jsonFiles.length === 0) {
    console.log('No landing JSON files found. Nothing to migrate.');
    return;
  }

  console.log(`Found ${jsonFiles.length} landing page(s) to migrate.\n`);

  let migrated = 0;
  let skipped = 0;

  for (const file of jsonFiles) {
    const slug = file.replace('.json', '');
    const filePath = path.join(LANDINGS_DIR, file);

    try {
      const content = await readFile(filePath, 'utf-8');
      const data: LandingData = JSON.parse(content);

      // Check if page already exists
      const existing = await prisma.page.findUnique({
        where: {
          businessId_slug: {
            businessId: business.id,
            slug,
          },
        },
      });

      if (existing) {
        console.log(`  SKIP  ${slug} (already exists)`);
        skipped++;
        continue;
      }

      // Convert landing blocks to Page Builder blocks
      const blocks = (data.blocks || []).map((block) => ({
        id: block.id,
        type: block.type,
        content: block.content,
      }));

      // Create a human-readable title from the slug
      const title = slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      await prisma.page.create({
        data: {
          businessId: business.id,
          title,
          slug,
          description: `Migrated from landing page: ${slug}`,
          type: 'landing',
          status: 'published',
          blocks: JSON.stringify(blocks),
          seo: JSON.stringify({
            title,
            description: `${title} - AdriSu Kids`,
          }),
          publishedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        },
      });

      console.log(`  OK    ${slug} (${blocks.length} blocks)`);
      migrated++;
    } catch (err) {
      console.error(`  ERROR ${slug}: ${(err as Error).message}`);
    }
  }

  console.log(`\nMigration complete: ${migrated} migrated, ${skipped} skipped.`);
}

main()
  .catch((e) => { console.error('Migration failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
