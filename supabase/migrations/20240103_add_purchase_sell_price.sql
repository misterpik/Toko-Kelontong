ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_price numeric(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sell_price numeric(12,2);

UPDATE products SET purchase_price = price * 0.7 WHERE purchase_price IS NULL;
UPDATE products SET sell_price = price WHERE sell_price IS NULL;

ALTER TABLE products ALTER COLUMN purchase_price SET NOT NULL;
ALTER TABLE products ALTER COLUMN sell_price SET NOT NULL;
