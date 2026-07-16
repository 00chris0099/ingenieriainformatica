-- FIX: Add missing product_id columns after partial migration
-- product_variants is already dropped, so old records get NULL product_id

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE price_list_items ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE goods_receipt_items ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE pick_list_items ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE return_items ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE cycle_count_items ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE lots ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE serial_numbers ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE quality_check_items ADD COLUMN IF NOT EXISTS product_id UUID;

-- Verify final state
SELECT 'products' as tbl, COUNT(*) as cnt FROM products
UNION ALL SELECT 'products_with_price', COUNT(*) FROM products WHERE price > 0
UNION ALL SELECT 'products_with_stock', COUNT(*) FROM products WHERE stock > 0
UNION ALL SELECT 'products_with_discount', COUNT(*) FROM products WHERE discount_percent IS NOT NULL AND discount_percent > 0;

SELECT 'Fix complete!' as status;
