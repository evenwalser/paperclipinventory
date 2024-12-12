-- Enable the ltree extension for hierarchical data
CREATE EXTENSION IF NOT EXISTS ltree;

-- Create the categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    parent_id UUID REFERENCES categories(id),
    level INTEGER NOT NULL,
    path LTREE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add category path to items
ALTER TABLE items 
ADD COLUMN category_path LTREE;

-- Add indexes
CREATE INDEX category_path_idx ON categories USING GIST (path);
CREATE INDEX category_parent_idx ON categories(parent_id);
CREATE INDEX category_level_idx ON categories(level);
CREATE INDEX item_category_idx ON items USING GIST (category_path); 