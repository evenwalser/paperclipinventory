-- Only insert categories if they don't exist
INSERT INTO categories (name, slug, level, path)
SELECT 'Women''s Clothing', 'womens-clothing', 1, 'womens'
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE slug = 'womens-clothing'
);

INSERT INTO categories (name, slug, level, path)
SELECT 'Men''s Clothing', 'mens-clothing', 1, 'mens'
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE slug = 'mens-clothing'
);

INSERT INTO categories (name, slug, level, path)
SELECT 'Accessories', 'accessories', 1, 'accessories'
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE slug = 'accessories'
);

-- Update some existing items with categories
UPDATE items 
SET category_path = 'womens'
WHERE category_path IS NULL 
AND LOWER(title) LIKE '%women%'
LIMIT 5;

UPDATE items 
SET category_path = 'mens'
WHERE category_path IS NULL 
AND LOWER(title) LIKE '%men%'
LIMIT 5;

UPDATE items 
SET category_path = 'accessories'
WHERE category_path IS NULL 
AND (
    LOWER(title) LIKE '%bag%' 
    OR LOWER(title) LIKE '%scarf%'
    OR LOWER(title) LIKE '%jewelry%'
)
LIMIT 5; 