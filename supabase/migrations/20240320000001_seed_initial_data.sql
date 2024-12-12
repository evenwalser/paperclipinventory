-- Insert categories
INSERT INTO categories (id, name, path, level) VALUES
  ('womens', 'Women''s Fashion', 'womens', 1),
  ('mens', 'Men''s Fashion', 'mens', 1),
  ('womens_bottoms', 'Bottoms', 'womens.bottoms', 2),
  ('womens_dresses', 'Dresses', 'womens.dresses', 2),
  ('mens_bottoms', 'Bottoms', 'mens.bottoms', 2),
  ('mens_tops', 'Tops', 'mens.tops', 2),
  ('womens_bottoms_jeans', 'Jeans', 'womens.bottoms.jeans', 3),
  ('womens_bottoms_skirts', 'Skirts', 'womens.bottoms.skirts', 3),
  ('womens_dresses_mini', 'Mini Dresses', 'womens.dresses.mini', 3),
  ('mens_bottoms_jeans', 'Jeans', 'mens.bottoms.jeans', 3),
  ('mens_tops_tshirts', 'T-Shirts', 'mens.tops.tshirts', 3)
ON CONFLICT (id) DO NOTHING;

-- Create a function to generate test items
CREATE OR REPLACE FUNCTION generate_test_items()
RETURNS void AS $$
DECLARE
  i INTEGER;
  category_id TEXT;
  price DECIMAL;
  cost DECIMAL;
  status TEXT;
  created_date DATE;
  sold_date DATE;
  returned_date DATE;
BEGIN
  FOR i IN 1..100 LOOP
    -- Select random category
    SELECT id INTO category_id FROM categories ORDER BY random() LIMIT 1;
    
    -- Generate price based on category
    price := CASE 
      WHEN category_id LIKE 'womens_bottoms_jeans%' THEN random() * (120 - 45) + 45
      WHEN category_id LIKE 'womens_bottoms_skirts%' THEN random() * (85 - 35) + 35
      WHEN category_id LIKE 'womens_dresses_mini%' THEN random() * (150 - 55) + 55
      WHEN category_id LIKE 'mens_bottoms_jeans%' THEN random() * (120 - 45) + 45
      WHEN category_id LIKE 'mens_tops_tshirts%' THEN random() * (60 - 25) + 25
      ELSE random() * (100 - 30) + 30
    END;
    
    -- Calculate cost (40-60% of price)
    cost := price * (0.4 + random() * 0.2);
    
    -- Generate dates and status
    created_date := CURRENT_DATE - (random() * 30)::INTEGER;
    status := (ARRAY['in_stock', 'sold', 'returned'])[1 + (random() * 3)::INTEGER];
    
    IF status IN ('sold', 'returned') THEN
      sold_date := created_date + (random() * 14)::INTEGER;
      IF status = 'returned' THEN
        returned_date := sold_date + (random() * 7)::INTEGER;
      END IF;
    END IF;

    -- Insert item
    INSERT INTO items (
      id, title, description, category_id, price, cost,
      currency, status, created_at, sold_at, returned_at
    ) VALUES (
      'item_' || i,
      'Test Item ' || i,
      'Description for item ' || i,
      category_id,
      price,
      cost,
      'GBP',
      status,
      created_date,
      sold_date,
      returned_date
    );
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate test items
SELECT generate_test_items(); 