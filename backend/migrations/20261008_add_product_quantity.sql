ALTER TABLE products
  ADD COLUMN quantity INT UNSIGNED NOT NULL DEFAULT 1
  AFTER condition_status;

UPDATE products
SET quantity = 0
WHERE status = 'sold';
