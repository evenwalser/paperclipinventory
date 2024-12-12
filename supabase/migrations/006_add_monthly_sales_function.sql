CREATE OR REPLACE FUNCTION get_monthly_category_sales(
  category_id UUID,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '1 year',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
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
      i.category_path ~ (SELECT path FROM categories WHERE id = category_id)
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