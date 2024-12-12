-- Clean existing categories without affecting items
TRUNCATE categories CASCADE;

-- Insert categories
INSERT INTO categories (id, name, path, level) VALUES
  ('womens', 'Women''s Fashion', 'womens', 1),
  ('mens', 'Men''s Fashion', 'mens', 1),
  -- ... rest of our categories
ON CONFLICT (id) DO NOTHING; 