-- Add station column to menu_items table
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS station VARCHAR(100);
