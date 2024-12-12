-- Add main categories
INSERT INTO categories (name, slug, level, path) VALUES
('Women''s Clothing', 'womens-clothing', 1, 'womens'),
('Men''s Clothing', 'mens-clothing', 1, 'mens'),
('Accessories', 'accessories', 1, 'accessories');

-- Add some test items
INSERT INTO items (title, category_path, price, status) VALUES
('Vintage Leather Jacket', 'womens', 95.00, 'sold'),
('Designer Handbag', 'accessories', 199.00, 'sold'),
('Men''s Denim Jacket', 'mens', 68.00, 'sold');

-- Add some test transactions
INSERT INTO transactions (item_id, total_amount, status, created_at)
SELECT 
    id,
    price,
    'completed',
    NOW() - (random() * interval '90 days')
FROM items 
WHERE status = 'sold'; 