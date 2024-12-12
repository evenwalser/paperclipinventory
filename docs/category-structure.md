# Category Structure Implementation

## Current Status
- Basic category structure implemented with LTREE
- Primary categories added
- Started Women's Fashion subcategories

## Database Structure
```sql
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
```

## TODO

### 1. Complete Category Structure
- [ ] Clean up existing duplicates
- [ ] Standardize slugs
- [ ] Add remaining Women's Fashion categories
- [ ] Add Baby & Child categories
- [ ] Add Men's Fashion categories
- [ ] Add remaining primary categories

### 2. Dashboard Integration
- [ ] Update CategorySelector for hierarchy
- [ ] Modify stats queries for LTREE
- [ ] Add breadcrumb navigation
- [ ] Update category performance metrics

### 3. Add/Edit Item Integration
- [ ] Update category selection UI
- [ ] Modify form for category_path
- [ ] Update validation
- [ ] Add category breadcrumbs

## SQL Helpers
```sql
-- Clean duplicates
DELETE FROM categories a USING categories b
WHERE a.path = b.path 
AND a.ctid > b.ctid;

-- Reset slugs
UPDATE categories
SET slug = CASE 
    WHEN level = 1 THEN create_slug(name)
    WHEN level = 2 THEN create_slug(path::text)
    WHEN level = 3 THEN create_slug(path::text)
END;
``` 