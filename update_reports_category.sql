-- Migration: Add category column and statistics RPC
-- Date: 2026-03-27

-- 1. Add category column to reports table
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Create statistics function
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE (tag TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT category as tag, count(*) as count
  FROM reports
  WHERE category IS NOT NULL
  GROUP BY category;
END;
$$ LANGUAGE plpgsql;

-- 3. Reload schema cache (optional but recommended)
NOTIFY pgrst, 'reload schema';
