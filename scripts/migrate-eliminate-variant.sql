-- ============================================================================
-- MIGRATION: Eliminate ProductVariant
-- Run this SQL directly in the database via psql
-- ============================================================================

-- Step 1: Add new columns to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "price" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "compare_at_price" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cost_price" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stock" INTEGER DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "discount_percent" DECIMAL(5,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "barcode" TEXT;

-- Step 2: Migrate price/cost/barcode from first variant to Product
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
WHERE EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."product_id" = p."id");

-- Step 3: Migrate stock from Inventory (sum across warehouses)
UPDATE "Product" p SET "stock" = COALESCE((
  SELECT SUM(i."quantity") FROM "Inventory" i
  JOIN "ProductVariant" v ON i."variant_id" = v."id"
  WHERE v."product_id" = p."id"
), 0)
WHERE EXISTS (SELECT 1 FROM "Inventory" i JOIN "ProductVariant" v ON i."variant_id" = v."id" WHERE v."product_id" = p."id");

-- Also migrate stock from ProductVariant.stock (tienda schema)
UPDATE "Product" p SET "stock" = COALESCE((
  SELECT SUM(v."stock") FROM "ProductVariant" v
  WHERE v."product_id" = p."id"
), 0)
WHERE EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."product_id" = p."id")
  AND p."stock" = 0;

-- Step 4: Extract discountPercent from priceConfig
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
  AND p."price_config"->>'descuento' != '0';

-- Step 5: FIX DOUBLE-DISCOUNT BUG
-- Reverse pre-computed discount: price was stored as basePrice * (1 - discount/100)
-- We need to recover the original base price
UPDATE "Product" p SET
  "price" = CASE
    WHEN p."discount_percent" > 0 AND p."discount_percent" < 100
    THEN ROUND(CAST(p."price" AS DECIMAL) / (1 - p."discount_percent" / 100), 2)
    ELSE p."price"
  END
WHERE p."discount_percent" IS NOT NULL AND p."discount_percent" > 0
  AND p."discount_percent" < 100;

-- Step 6: Update FK references - create temp mapping table
CREATE TEMPORARY TABLE variant_product_map AS
SELECT "id" AS "variantId", "product_id" AS "productId" FROM "ProductVariant";

-- Update OrderItem
UPDATE "OrderItem" oi SET
  "product_id" = vpm."productId"
FROM variant_product_map vpm
WHERE oi."variant_id" = vpm."variantId" AND oi."variant_id" IS NOT NULL;

-- Update variantName = productName
UPDATE "OrderItem" SET "variant_name" = "product_name" WHERE "variant_name" IS NOT NULL AND "variant_name" != "product_name";

-- Update Wishlist (tienda)
UPDATE "Wishlist" w SET
  "product_id" = vpm."productId"
FROM variant_product_map vpm
WHERE w."variant_id" = vpm."variantId";

-- Update PriceListItem
UPDATE "PriceListItem" pli SET
  "product_id" = vpm."productId"
FROM variant_product_map vpm
WHERE pli."variant_id" = vpm."variantId";

-- Update PurchaseOrderItem
UPDATE "PurchaseOrderItem" poi SET
  "product_id" = vpm."productId"
FROM variant_product_map vpm
WHERE poi."variant_id" = vpm."variantId";

-- Update GoodsReceiptItem
UPDATE "GoodsReceiptItem" gri SET
  "product_id" = vpm."productId"
FROM variant_product_map vpm
WHERE gri."variant_id" = vpm."variantId";

-- Update PickListItem
UPDATE "PickListItem" pli SET
  "product_id" = vpm."productId"
FROM variant_product_map vpm
WHERE pli."variant_id" = vpm."variantId";

-- Update ReturnItem
UPDATE "ReturnItem" ri SET
  "product_id" = vpm."productId"
FROM variant_product_map vpm
WHERE ri."variant_id" = vpm."variantId";

-- Update CycleCountItem
UPDATE "CycleCountItem" cci SET
  "product_id" = vpm."productId"
FROM variant_product_map vpm
WHERE cci."variant_id" = vpm."variantId";

-- Update Lot
UPDATE "Lot" l SET
  "product_id" = vpm."productId"
FROM variant_product_map vpm
WHERE l."variant_id" = vpm."variantId";

-- Update SerialNumber
UPDATE "SerialNumber" sn SET
  "product_id" = vpm."productId"
FROM variant_product_map vpm
WHERE sn."variant_id" = vpm."variantId";

-- Update QualityCheckItem
UPDATE "QualityCheckItem" qci SET
  "product_id" = vpm."productId"
FROM variant_product_map vpm
WHERE qci."variant_id" = vpm."variantId";

-- Update CartItem (tienda)
UPDATE "CartItem" ci SET
  "product_id" = vpm."productId"
FROM variant_product_map vpm
WHERE ci."variant_id" = vpm."variantId";

-- Clear Review variantId
UPDATE "Review" SET "variant_id" = NULL WHERE "variant_id" IS NOT NULL;

-- Step 7: Verify
SELECT 'Products' as tbl, COUNT(*) as cnt FROM "Product"
UNION ALL
SELECT 'Variants', COUNT(*) FROM "ProductVariant"
UNION ALL
SELECT 'OrderItems with productId', COUNT(*) FROM "OrderItem" WHERE "product_id" IS NOT NULL
UNION ALL
SELECT 'Products with price > 0', COUNT(*) FROM "Product" WHERE "price" > 0;

-- Step 8: Drop old tables
DROP TABLE IF EXISTS "Inventory" CASCADE;
DROP TABLE IF EXISTS "ProductVariant" CASCADE;

-- Step 9: Drop old columns
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "variant_name";
ALTER TABLE "Wishlist" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "PriceListItem" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "PurchaseOrderItem" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "GoodsReceiptItem" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "PickListItem" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "ReturnItem" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "CycleCountItem" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "Lot" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "SerialNumber" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "QualityCheckItem" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "CartItem" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "Review" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "price_config";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "discount_popup";

-- Drop temp table
DROP TABLE IF EXISTS variant_product_map;

-- Done!
SELECT 'Migration complete!' as status;
