-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  profile_image TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff'))
);

-- Create items table with our current structure
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  subcategory1 TEXT,
  subcategory2 TEXT,
  condition TEXT NOT NULL,
  size TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'low_stock', 'out_of_stock')),
  available_in_store BOOLEAN DEFAULT true,
  list_on_paperclip BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create item_images table with display_order
CREATE TABLE IF NOT EXISTS item_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rest of the tables remain the same
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  total_amount NUMERIC(10,2) NOT NULL,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('completed', 'refunded'))
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  quantity INT NOT NULL,
  price NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  total_sales NUMERIC(10,2) NOT NULL,
  total_customers INT NOT NULL,
  total_inventory INT NOT NULL,
  sales_velocity NUMERIC(10,2) NOT NULL,
  date_range TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  store_profile JSONB,
  inventory_settings JSONB,
  pos_settings JSONB,
  notification_settings JSONB,
  integration_settings JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_item_images_item_id ON item_images(item_id);
CREATE INDEX IF NOT EXISTS idx_item_images_display_order ON item_images(display_order);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_summary_category ON sales_summary(category);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Enable read access for all users" ON items FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON items FOR ALL USING (true);

-- Policies for items table
CREATE POLICY "Enable read access for all users" ON items
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON items
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON items
    FOR DELETE USING (true);

-- Policies for item_images table
CREATE POLICY "Enable read access for all users" ON item_images
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON item_images
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON item_images
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON item_images
    FOR DELETE USING (true);