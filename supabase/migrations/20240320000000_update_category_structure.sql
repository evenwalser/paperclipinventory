-- First, create the categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path ltree NOT NULL,
  level INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add ltree extension if not exists
CREATE EXTENSION IF NOT EXISTS ltree;

-- Modify items table to use new category structure
ALTER TABLE items
  -- Add new category reference
  ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES categories(id),
  -- Add currency support
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'GBP',
  -- Keep existing category columns for backward compatibility
  ALTER COLUMN category DROP NOT NULL,
  ALTER COLUMN subcategory1 DROP NOT NULL,
  ALTER COLUMN subcategory2 DROP NOT NULL;

-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(5) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, is_default) 
VALUES 
  ('GBP', 'British Pound', '£', true),
  ('USD', 'US Dollar', '$', false),
  ('EUR', 'Euro', '€', false)
ON CONFLICT (code) DO NOTHING;

-- Add index for category path queries
CREATE INDEX IF NOT EXISTS idx_category_path ON categories USING GIST (path);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);

-- Enable RLS on new tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Add open policies for new tables
CREATE POLICY "Open Policy" ON categories FOR ALL USING (true);
CREATE POLICY "Open Policy" ON currencies FOR ALL USING (true); 