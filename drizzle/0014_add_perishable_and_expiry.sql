-- Migration: Add perishable flag and expiry date fields
ALTER TABLE products
  ADD COLUMN is_perishable TINYINT DEFAULT 0,
  ADD COLUMN expiry_date DATE NULL;

ALTER TABLE product_batches
  ADD COLUMN expiry_date DATE NULL;
