-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
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

-- Create or replace the get_overall_stats function
CREATE OR REPLACE FUNCTION get_overall_stats(
    date_from TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    date_to TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'revenue', json_build_object(
            'total', COALESCE((
                SELECT SUM(total_amount)
                FROM transactions
                WHERE created_at BETWEEN date_from AND date_to
            ), 0),
            'percentageChange', 0 -- TODO: Implement percentage change calculation
        ),
        'items', json_build_object(
            'total', (SELECT COUNT(*) FROM items),
            'newThisWeek', (
                SELECT COUNT(*)
                FROM items
                WHERE created_at >= NOW() - INTERVAL '7 days'
            )
        ),
        'salesVelocity', json_build_object(
            'averageDays', COALESCE((
                SELECT AVG(EXTRACT(EPOCH FROM (t.created_at - i.created_at))/86400)
                FROM transactions t
                JOIN items i ON i.id = t.item_id
                WHERE t.created_at BETWEEN date_from AND date_to
            ), 0),
            'description', 'Average time to sell'
        ),
        'returnRate', json_build_object(
            'percentage', COALESCE((
                SELECT COUNT(*) FILTER (WHERE is_return) * 100.0 / NULLIF(COUNT(*), 0)
                FROM transactions
                WHERE created_at BETWEEN date_from AND date_to
            ), 0),
            'change', 0 -- TODO: Implement return rate change calculation
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create or replace the get_monthly_category_sales function
CREATE OR REPLACE FUNCTION get_monthly_category_sales(
    category_id UUID,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '1 year',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS TABLE (
    month TEXT,
    total NUMERIC,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT
            TO_CHAR(DATE_TRUNC('month', t.created_at), 'Mon') as month,
            DATE_TRUNC('month', t.created_at) as month_date,
            SUM(t.total_amount) as total,
            COUNT(*) as count
        FROM transactions t
        JOIN items i ON i.id = t.item_id
        WHERE 
            (category_id IS NULL OR i.category_path ~ (SELECT path FROM categories WHERE id = category_id))
            AND t.created_at BETWEEN start_date AND end_date
            AND t.status = 'completed'
        GROUP BY DATE_TRUNC('month', t.created_at)
    )
    SELECT 
        md.month,
        md.total,
        md.count
    FROM monthly_data md
    ORDER BY md.month_date;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the get_top_selling_items function
CREATE OR REPLACE FUNCTION get_top_selling_items(
    category_id UUID,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    sort_by TEXT DEFAULT 'value'
) RETURNS TABLE (
    id UUID,
    title TEXT,
    sales_count BIGINT,
    revenue NUMERIC,
    average_price NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        i.title,
        COUNT(*) as sales_count,
        SUM(t.total_amount) as revenue,
        AVG(t.total_amount) as average_price
    FROM items i
    JOIN transactions t ON t.item_id = i.id
    WHERE 
        (category_id IS NULL OR i.category_path ~ (SELECT path FROM categories WHERE id = category_id))
        AND t.created_at BETWEEN start_date AND end_date
        AND t.status = 'completed'
    GROUP BY i.id, i.title
    ORDER BY 
        CASE 
            WHEN sort_by = 'value' THEN SUM(t.total_amount)
            ELSE COUNT(*)
        END DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql; 