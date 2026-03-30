-- ============================================================
-- ENABLE REALTIME FOR CIVICFIX TABLES
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Ensure the supabase_realtime publication exists
-- (This is usually created by default, but let's be safe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. Add tables to the publication
-- This allows Supabase to broadcast 'INSERT' and 'UPDATE' events to the client
ALTER PUBLICATION supabase_realtime ADD TABLE reports;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 3. Verify
-- You can check the current list of tables in the publication with:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
