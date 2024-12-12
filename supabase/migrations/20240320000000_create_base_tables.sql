-- Create base tables
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  level INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES categories(id),
  price DECIMAL NOT NULL,
  cost DECIMAL NOT NULL,
  status TEXT NOT NULL,
  created_at DATE NOT NULL,
  sold_at DATE,
  returned_at DATE
); 