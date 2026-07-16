/**
 * Migration: Eliminate ProductVariant
 *
 * This script migrates data from ProductVariant to Product before the schema
 * change is applied via `prisma db push`. It handles:
 * 1. Adding new columns to Product (price, stock, discountPercent, etc.)
 * 2. Copying data from the first variant to Product
 * 3. Fixing the double-discount bug (reversing pre-computed discounts)
 * 4. Updating FK references from variantId to productId
 * 5. Dropping old tables and columns
 *
 * Usage:
 *   npx tsx scripts/migrate-eliminate-variant.ts --dry-run
 *   npx tsx scripts/migrate-eliminate-variant.ts --database wms
 *   npx tsx scripts/migrate-eliminate-variant.ts --database tienda
 *   npx tsx scripts/migrate-eliminate-variant.ts --database all
 */

import { Client } from 'pg';

interface MigrationOptions {
  dryRun: boolean;
  database: 'wms' | 'tienda' | 'all';
}

function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    database: (args.find(a => a.startsWith('--database='))?.split('=')[1] ||
               args[args.indexOf('--database') + 1] || 'all') as 'wms' | 'tienda' | 'all',
  };
}

async function runMigration(client: Client, dbName: string, dryRun: boolean) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Migrating database: ${dbName}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);
  console.log(`${'='.repeat(60)}\n`);

  const execute = async (sql: string, description: string) => {
    console.log(`  → ${description}`);
    if (!dryRun) {
      try {
        await client.query(sql);
        console.log(`    ✓ Done`);
      } catch (e: any) {
        if (e.code === '42701' || e.code === '42P07' || e.code === '42710') {
          // Column/table already exists - skip
          console.log(`    ⊘ Already exists, skipping`);
        } else {
          console.error(`    ✗ Error: ${e.message}`);
          throw e;
        }
      }
    } else {
      console.log(`    ⊘ Dry run - skipped`);
    }
  };

  const query = async (sql: string): Promise<any[]> => {
    const result = await client.query(sql);
    return result.rows;
  };

  // ── Step 1: Add new columns to Product ──────────────────────────────
  console.log('\nStep 1: Adding new columns to Product...');

  await execute(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "price" DECIMAL(10,2) DEFAULT 0`, 'Add price column');
  await execute(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "compare_at_price" DECIMAL(10,2)`, 'Add compare_at_price column');
  await execute(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cost_price" DECIMAL(10,2)`, 'Add cost_price column');
  await execute(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stock" INTEGER DEFAULT 0`, 'Add stock column');
  await execute(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "discount_percent" DECIMAL(5,2)`, 'Add discount_percent column');
  await execute(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "barcode" TEXT`, 'Add barcode column');

  // ── Step 2: Migrate price/SKU/stock from first variant ─────────────
  console.log('\nStep 2: Migrating data from ProductVariant to Product...');

  const migratePriceSQL = `
    UPDATE "Product" p SET
      "price" = COALESCE((
        SELECT v."price" FROM "ProductVariant" v
        WHERE v."product_id" = p."id"
        ORDER BY v."created_at" ASC LIMIT 1
      ), 0),
      "compare_at_price" = (
        SELECT v."compare_at_price" FROM "ProductVariant" v
        WHERE v."product_id" = p."id"
        ORDER BY v."created_at" ASC LIMIT 1
      ),
      "cost_price" = (
        SELECT v."cost_price" FROM "ProductVariant" v
        WHERE v."product_id" = p."id"
        ORDER BY v."created_at" ASC LIMIT 1
      ),
      "barcode" = (
        SELECT v."barcode" FROM "ProductVariant" v
        WHERE v."product_id" = p."id"
        ORDER BY v."created_at" ASC LIMIT 1
      )
    WHERE EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."product_id" = p."id")
  `;
  await execute(migratePriceSQL, 'Copy price/cost/barcode from first variant');

  // Migrate stock from Inventory (WMS) or ProductVariant.stock (Tienda)
  if (dbName === 'wms' || dbName === 'all') {
    const migrateStockWMS = `
      UPDATE "Product" p SET "stock" = COALESCE((
        SELECT SUM(i."quantity") FROM "Inventory" i
        JOIN "ProductVariant" v ON i."variant_id" = v."id"
        WHERE v."product_id" = p."id"
      ), 0)
      WHERE EXISTS (SELECT 1 FROM "Inventory" i JOIN "ProductVariant" v ON i."variant_id" = v."id" WHERE v."product_id" = p."id")
    `;
    await execute(migrateStockWMS, 'Sum stock from Inventory (WMS)');
  }

  if (dbName === 'tienda' || dbName === 'all') {
    const migrateStockTienda = `
      UPDATE "Product" p SET "stock" = COALESCE((
        SELECT SUM(v."stock") FROM "ProductVariant" v
        WHERE v."product_id" = p."id"
      ), 0)
      WHERE EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."product_id" = p."id")
    `;
    await execute(migrateStockTienda, 'Sum stock from ProductVariant.stock (Tienda)');
  }

  // ── Step 3: Extract discountPercent from priceConfig ────────────────
  console.log('\nStep 3: Extracting discountPercent from priceConfig...');

  const migrateDiscount = `
    UPDATE "Product" p SET "discount_percent" = (
      SELECT CAST(p."price_config"->>'descuento' AS DECIMAL)
      WHERE p."price_config" IS NOT NULL
        AND p."price_config"->>'descuento' IS NOT NULL
        AND p."price_config"->>'descuento' != ''
        AND p."price_config"->>'descuento' != '0'
    )
    WHERE p."price_config" IS NOT NULL
      AND p."price_config"->>'descuento' IS NOT NULL
      AND p."price_config"->>'descuento' != ''
      AND p."price_config"->>'descuento' != '0'
  `;
  await execute(migrateDiscount, 'Extract descuento from priceConfig');

  // ── Step 4: Fix double-discount bug ────────────────────────────────
  console.log('\nStep 4: Fixing double-discount bug (reversing pre-computation)...');

  const fixDoubleDiscount = `
    UPDATE "Product" p SET
      "price" = CASE
        WHEN p."discount_percent" > 0 AND p."discount_percent" < 100
        THEN ROUND(CAST(p."price" AS DECIMAL) / (1 - p."discount_percent" / 100), 2)
        ELSE p."price"
      END
    WHERE p."discount_percent" IS NOT NULL AND p."discount_percent" > 0
      AND p."discount_percent" < 100
  `;
  await execute(fixDoubleDiscount, 'Reverse pre-computed discount in price');

  // ── Step 5: Create variant→product mapping ─────────────────────────
  console.log('\nStep 5: Updating FK references...');

  const createMapping = `
    CREATE TEMPORARY TABLE IF NOT EXISTS variant_product_map AS
    SELECT "id" AS "variantId", "product_id" AS "productId" FROM "ProductVariant"
  `;
  await execute(createMapping, 'Create variant→product mapping table');

  // Update OrderItem
  const updateOrderItem = `
    UPDATE "OrderItem" oi SET
      "product_id" = vpm."productId"
    FROM variant_product_map vpm
    WHERE oi."variant_id" = vpm."variantId"
      AND oi."variant_id" IS NOT NULL
  `;
  await execute(updateOrderItem, 'Update OrderItem variantId → productId');

  // Update variantName in OrderItem (set to productName)
  await execute(
    `UPDATE "OrderItem" SET "variant_name" = "product_name" WHERE "variant_name" IS NOT NULL AND "variant_name" != "product_name"`,
    'Update OrderItem variantName = productName'
  );

  // Update Wishlist
  const updateWishlist = `
    UPDATE "Wishlist" w SET
      "product_id" = vpm."productId"
    FROM variant_product_map vpm
    WHERE w."variant_id" = vpm."variantId"
  `;
  await execute(updateWishlist, 'Update Wishlist variantId → productId');

  // Update PriceListItem
  const updatePriceListItem = `
    UPDATE "PriceListItem" pli SET
      "product_id" = vpm."productId"
    FROM variant_product_map vpm
    WHERE pli."variant_id" = vpm."variantId"
  `;
  await execute(updatePriceListItem, 'Update PriceListItem variantId → productId');

  // Update PurchaseOrderItem
  const updatePOItem = `
    UPDATE "PurchaseOrderItem" poi SET
      "product_id" = vpm."productId"
    FROM variant_product_map vpm
    WHERE poi."variant_id" = vpm."variantId"
  `;
  await execute(updatePOItem, 'Update PurchaseOrderItem variantId → productId');

  // Update GoodsReceiptItem
  const updateGRIItem = `
    UPDATE "GoodsReceiptItem" gri SET
      "product_id" = vpm."productId"
    FROM variant_product_map vpm
    WHERE gri."variant_id" = vpm."variantId"
  `;
  await execute(updateGRIItem, 'Update GoodsReceiptItem variantId → productId');

  // Update PickListItem (WMS only)
  if (dbName === 'wms' || dbName === 'all') {
    const updatePLI = `
      UPDATE "PickListItem" pli SET
        "product_id" = vpm."productId"
      FROM variant_product_map vpm
      WHERE pli."variant_id" = vpm."variantId"
    `;
    await execute(updatePLI, 'Update PickListItem variantId → productId');
  }

  // Update ReturnItem (WMS only)
  if (dbName === 'wms' || dbName === 'all') {
    const updateRI = `
      UPDATE "ReturnItem" ri SET
        "product_id" = vpm."productId"
      FROM variant_product_map vpm
      WHERE ri."variant_id" = vpm."variantId"
    `;
    await execute(updateRI, 'Update ReturnItem variantId → productId');
  }

  // Update CycleCountItem (WMS only)
  if (dbName === 'wms' || dbName === 'all') {
    const updateCCI = `
      UPDATE "CycleCountItem" cci SET
        "product_id" = vpm."productId"
      FROM variant_product_map vpm
      WHERE cci."variant_id" = vpm."variantId"
    `;
    await execute(updateCCI, 'Update CycleCountItem variantId → productId');
  }

  // Update Lot (WMS only)
  if (dbName === 'wms' || dbName === 'all') {
    const updateLot = `
      UPDATE "Lot" l SET
        "product_id" = vpm."productId"
      FROM variant_product_map vpm
      WHERE l."variant_id" = vpm."variantId"
    `;
    await execute(updateLot, 'Update Lot variantId → productId');
  }

  // Update SerialNumber (WMS only)
  if (dbName === 'wms' || dbName === 'all') {
    const updateSN = `
      UPDATE "SerialNumber" sn SET
        "product_id" = vpm."productId"
      FROM variant_product_map vpm
      WHERE sn."variant_id" = vpm."variantId"
    `;
    await execute(updateSN, 'Update SerialNumber variantId → productId');
  }

  // Update QualityCheckItem (WMS only)
  if (dbName === 'wms' || dbName === 'all') {
    const updateQCI = `
      UPDATE "QualityCheckItem" qci SET
        "product_id" = vpm."productId"
      FROM variant_product_map vpm
      WHERE qci."variant_id" = vpm."variantId"
    `;
    await execute(updateQCI, 'Update QualityCheckItem variantId → productId');
  }

  // Update CartItem (Tienda only)
  if (dbName === 'tienda' || dbName === 'all') {
    const updateCart = `
      UPDATE "CartItem" ci SET
        "product_id" = vpm."productId"
      FROM variant_product_map vpm
      WHERE ci."variant_id" = vpm."variantId"
    `;
    await execute(updateCart, 'Update CartItem variantId → productId');
  }

  // Update Review (Tienda only) - remove variantId reference
  if (dbName === 'tienda' || dbName === 'all') {
    await execute(
      `UPDATE "Review" SET "variant_id" = NULL WHERE "variant_id" IS NOT NULL`,
      'Clear Review variantId references'
    );
  }

  // ── Step 6: Verify row counts ──────────────────────────────────────
  console.log('\nStep 6: Verifying migration...');

  const counts = await query(`
    SELECT
      (SELECT COUNT(*) FROM "Product") as products,
      (SELECT COUNT(*) FROM "ProductVariant") as variants,
      (SELECT COUNT(*) FROM "OrderItem" WHERE "product_id" IS NOT NULL) as order_items_with_product,
      (SELECT COUNT(*) FROM "OrderItem" WHERE "product_id" IS NULL) as order_items_without_product,
      (SELECT COUNT(*) FROM "Product" WHERE "price" > 0) as products_with_price
  `);
  console.log('  Verification counts:');
  console.log(`    Products: ${counts[0].products}`);
  console.log(`    Variants (to be dropped): ${counts[0].variants}`);
  console.log(`    OrderItems with productId: ${counts[0].order_items_with_product}`);
  console.log(`    OrderItems without productId: ${counts[0].order_items_without_product}`);
  console.log(`    Products with price > 0: ${counts[0].products_with_price}`);

  // ── Step 7: Drop old tables and columns ────────────────────────────
  console.log('\nStep 7: Dropping old tables and columns...');

  // Drop Inventory first (has FK to ProductVariant)
  if (dbName === 'wms' || dbName === 'all') {
    await execute(`DROP TABLE IF EXISTS "Inventory" CASCADE`, 'Drop Inventory table');
  }

  await execute(`DROP TABLE IF EXISTS "ProductVariant" CASCADE`, 'Drop ProductVariant table');

  // Drop old FK columns
  await execute(`ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "variant_id"`, 'Drop OrderItem.variant_id');
  await execute(`ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "variant_name"`, 'Drop OrderItem.variant_name');
  await execute(`ALTER TABLE "Wishlist" DROP COLUMN IF EXISTS "variant_id"`, 'Drop Wishlist.variant_id');
  await execute(`ALTER TABLE "PriceListItem" DROP COLUMN IF EXISTS "variant_id"`, 'Drop PriceListItem.variant_id');
  await execute(`ALTER TABLE "PurchaseOrderItem" DROP COLUMN IF EXISTS "variant_id"`, 'Drop PurchaseOrderItem.variant_id');
  await execute(`ALTER TABLE "GoodsReceiptItem" DROP COLUMN IF EXISTS "variant_id"`, 'Drop GoodsReceiptItem.variant_id');

  if (dbName === 'wms' || dbName === 'all') {
    await execute(`ALTER TABLE "PickListItem" DROP COLUMN IF EXISTS "variant_id"`, 'Drop PickListItem.variant_id');
    await execute(`ALTER TABLE "ReturnItem" DROP COLUMN IF EXISTS "variant_id"`, 'Drop ReturnItem.variant_id');
    await execute(`ALTER TABLE "CycleCountItem" DROP COLUMN IF EXISTS "variant_id"`, 'Drop CycleCountItem.variant_id');
    await execute(`ALTER TABLE "Lot" DROP COLUMN IF EXISTS "variant_id"`, 'Drop Lot.variant_id');
    await execute(`ALTER TABLE "SerialNumber" DROP COLUMN IF EXISTS "variant_id"`, 'Drop SerialNumber.variant_id');
    await execute(`ALTER TABLE "QualityCheckItem" DROP COLUMN IF EXISTS "variant_id"`, 'Drop QualityCheckItem.variant_id');
  }

  if (dbName === 'tienda' || dbName === 'all') {
    await execute(`ALTER TABLE "CartItem" DROP COLUMN IF EXISTS "variant_id"`, 'Drop CartItem.variant_id');
    await execute(`ALTER TABLE "Review" DROP COLUMN IF EXISTS "variant_id"`, 'Drop Review.variant_id');
  }

  // Drop priceConfig
  await execute(`ALTER TABLE "Product" DROP COLUMN IF EXISTS "price_config"`, 'Drop Product.price_config');
  await execute(`ALTER TABLE "Product" DROP COLUMN IF EXISTS "discount_popup"`, 'Drop Product.discount_popup');

  // Drop temp table
  await execute(`DROP TABLE IF EXISTS variant_product_map`, 'Drop temp mapping table');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Migration complete for ${dbName}!`);
  console.log(`${'='.repeat(60)}`);
}

async function main() {
  const options = parseArgs();
  console.log('Migration: Eliminate ProductVariant');
  console.log(`Options: ${JSON.stringify(options)}`);

  // Database URLs from environment
  const databases: Record<string, string> = {
    wms: process.env.DATABASE_URL!,
    tienda: process.env.DATABASE_URL_TIENDA || process.env.DATABASE_URL!,
  };

  // Allow overriding via env vars
  if (process.env.WMS_DATABASE_URL) databases.wms = process.env.WMS_DATABASE_URL;
  if (process.env.TIENDA_DATABASE_URL) databases.tienda = process.env.TIENDA_DATABASE_URL;

  const databasesToMigrate = options.database === 'all'
    ? Object.entries(databases)
    : [[options.database, databases[options.database]]];

  for (const [name, url] of databasesToMigrate) {
    if (!url) {
      console.error(`No DATABASE_URL found for ${name}. Set WMS_DATABASE_URL or TIENDA_DATABASE_URL.`);
      continue;
    }

    const client = new Client({ connectionString: url });
    await client.connect();

    try {
      await runMigration(client, name, options.dryRun);
    } catch (e) {
      console.error(`\nMigration FAILED for ${name}:`, e);
      process.exit(1);
    } finally {
      await client.end();
    }
  }

  console.log('\nAll migrations complete!');
}

main().catch(console.error);
