-- Add main categories and subcategories
INSERT INTO categories (name, slug, level, path) VALUES
-- Women's Clothing
('Women''s Clothing', 'womens-clothing', 1, 'womens'),
('Dresses', 'dresses', 2, 'womens.dresses'),
('Tops', 'tops', 2, 'womens.tops'),
('Outerwear', 'outerwear', 2, 'womens.outerwear'),

-- Men's Clothing
('Men''s Clothing', 'mens-clothing', 1, 'mens'),
('Shirts', 'shirts', 2, 'mens.shirts'),
('Jackets', 'jackets', 2, 'mens.jackets'),
('Trousers', 'trousers', 2, 'mens.trousers'),

-- Accessories
('Accessories', 'accessories', 1, 'accessories'),
('Bags', 'bags', 2, 'accessories.bags'),
('Jewelry', 'jewelry', 2, 'accessories.jewelry'),
('Scarves', 'scarves', 2, 'accessories.scarves');

-- Add items with seasonal variations
INSERT INTO items (title, category_path, price, status, created_at) VALUES
-- Summer items (higher prices during season)
('Floral Summer Dress', 'womens.dresses', 89.99, 'sold', NOW() - interval '120 days'),
('Light Cotton Blouse', 'womens.tops', 45.00, 'sold', NOW() - interval '90 days'),
('Linen Shirt', 'mens.shirts', 65.00, 'sold', NOW() - interval '100 days'),
('Summer Tote Bag', 'accessories.bags', 79.99, 'sold', NOW() - interval '110 days'),

-- Winter items
('Wool Coat', 'womens.outerwear', 299.99, 'sold', NOW() - interval '180 days'),
('Cashmere Sweater', 'womens.tops', 150.00, 'sold', NOW() - interval '170 days'),
('Leather Jacket', 'mens.jackets', 250.00, 'sold', NOW() - interval '160 days'),
('Winter Scarf Set', 'accessories.scarves', 45.00, 'sold', NOW() - interval '165 days'),

-- Spring items
('Light Denim Jacket', 'womens.outerwear', 95.00, 'sold', NOW() - interval '60 days'),
('Floral Blouse', 'womens.tops', 55.00, 'sold', NOW() - interval '50 days'),
('Spring Blazer', 'mens.jackets', 175.00, 'sold', NOW() - interval '55 days'),
('Silk Scarf', 'accessories.scarves', 35.00, 'available', NOW() - interval '45 days'),

-- High-value items
('Designer Evening Dress', 'womens.dresses', 499.99, 'sold', NOW() - interval '30 days'),
('Luxury Leather Bag', 'accessories.bags', 899.99, 'sold', NOW() - interval '40 days'),
('Premium Suit Jacket', 'mens.jackets', 599.99, 'sold', NOW() - interval '35 days'),
('Diamond Necklace', 'accessories.jewelry', 999.99, 'available', NOW() - interval '25 days'),

-- Regular inventory
('Cotton T-Shirt', 'womens.tops', 25.00, 'sold', NOW() - interval '80 days'),
('Denim Jeans', 'mens.trousers', 85.00, 'sold', NOW() - interval '75 days'),
('Canvas Tote', 'accessories.bags', 35.00, 'sold', NOW() - interval '70 days'),
('Silver Bracelet', 'accessories.jewelry', 45.00, 'available', NOW() - interval '65 days');

-- Add transactions with seasonal patterns
-- Summer sales (higher volume)
INSERT INTO transactions (item_id, total_amount, status, is_return, created_at)
SELECT 
    id,
    CASE 
        WHEN EXTRACT(MONTH FROM NOW() - (random() * interval '90 days')) IN (6,7,8) 
        THEN price * 1.1  -- 10% premium during peak season
        ELSE price
    END,
    'completed',
    false,
    NOW() - (random() * interval '90 days')
FROM items 
WHERE status = 'sold'
AND category_path LIKE 'womens%'
OR category_path LIKE 'mens%';

-- Winter sales
INSERT INTO transactions (item_id, total_amount, status, is_return, created_at)
SELECT 
    id,
    CASE 
        WHEN EXTRACT(MONTH FROM NOW() - (random() * interval '180 days')) IN (12,1,2) 
        THEN price * 1.15  -- 15% premium during winter
        ELSE price
    END,
    'completed',
    false,
    NOW() - (random() * interval '180 days')
FROM items 
WHERE status = 'sold'
AND (category_path LIKE '%.outerwear'
OR category_path LIKE '%.jackets');

-- Regular sales throughout the year
INSERT INTO transactions (item_id, total_amount, status, is_return, created_at)
SELECT 
    id,
    price,
    'completed',
    false,
    NOW() - (random() * interval '365 days')
FROM items 
WHERE status = 'sold'
LIMIT 50;

-- Add some returns (about 5% return rate)
INSERT INTO transactions (item_id, total_amount, status, is_return, created_at)
SELECT 
    id,
    price * -1,
    'completed',
    true,
    created_at + interval '14 days'  -- Returns typically happen within 2 weeks
FROM items 
WHERE status = 'sold'
AND random() < 0.05;  -- 5% return rate

-- Add some high-value sales with seasonal patterns
INSERT INTO transactions (item_id, total_amount, status, is_return, created_at)
SELECT 
    id,
    price * 1.2,  -- Premium pricing for luxury items
    'completed',
    false,
    NOW() - (random() * interval '90 days')
FROM items 
WHERE price > 400
AND status = 'sold'; 

-- Update the prices to use GBP (multiply USD prices by 0.8 for rough conversion)
UPDATE items SET price = price * 0.8;